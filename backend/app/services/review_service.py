from __future__ import annotations

import logging
from datetime import datetime, timezone

from app.db.mongo import get_mongo_db
from app.models.mongo_models import Review
from app.models.sql_models import User
from app.schemas.review import CreateReviewRequest, ReviewResponse, ReviewStatusResponse
from app.services.analysis_service import enqueue_job
from app.services.team_service import ensure_team_member, user_team_ids
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


async def _serialize_review(review: Review) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        title=review.title,
        diff=review.diff,
        team_id=review.team_id,
        status=review.status,
        findings=review.findings,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


async def create_review(current_user: User, payload: CreateReviewRequest, db: Session) -> Review:
    if payload.team_id:
        ensure_team_member(db, current_user.id, payload.team_id)
    review = Review(
        user_id=current_user.id,
        team_id=payload.team_id,
        title=payload.title.strip(),
        diff=payload.diff.strip(),
        status="pending",
        findings=[],
        error_message=None,
    )
    review.created_at = datetime.now(timezone.utc)
    review.updated_at = datetime.now(timezone.utc)

    db = get_mongo_db()
    await db.reviews.insert_one(review.model_dump(mode="json"))
    try:
        await enqueue_job(review.id)
    except Exception:
        await db.reviews.update_one({"id": review.id}, {"$set": {"status": "error", "error_message": "Redis queue failed to accept the review"}})
        logger.exception("Failed to enqueue review %s", review.id)
        raise
    logger.info("Created review %s for user %s", review.id, current_user.id)
    return review


async def get_review(current_user: User, review_id: str, db: Session) -> Review:
    mongo_db = get_mongo_db()
    team_ids = user_team_ids(db, current_user.id)
    document = await mongo_db.reviews.find_one({"id": review_id, "$or": [{"user_id": current_user.id}, {"team_id": {"$in": team_ids}}]})
    if not document:
        raise ValueError("Review not found")
    return Review.model_validate(document)


async def get_review_status(current_user: User, review_id: str, db: Session) -> str:
    mongo_db = get_mongo_db()
    team_ids = user_team_ids(db, current_user.id)
    document = await mongo_db.reviews.find_one({"id": review_id, "$or": [{"user_id": current_user.id}, {"team_id": {"$in": team_ids}}]}, {"status": 1})
    if not document:
        raise ValueError("Review not found")
    return document.get("status", "pending")


async def list_reviews(current_user: User, db: Session, team_id: str | None = None) -> list[Review]:
    mongo_db = get_mongo_db()
    if team_id:
        ensure_team_member(db, current_user.id, team_id)
        query = {"team_id": team_id}
    else:
        query = {"$or": [{"user_id": current_user.id}, {"team_id": {"$in": user_team_ids(db, current_user.id)}}]}
    documents = await mongo_db.reviews.find(query).sort("created_at", -1).to_list(length=50)
    return [Review.model_validate(document) for document in documents]


async def update_review_status(
    review_id: str,
    *,
    status: str | None = None,
    findings: list[dict] | None = None,
    error_message: str | None = None,
) -> None:
    db = get_mongo_db()
    updates: dict[str, object] = {}
    if status is not None:
        updates["status"] = status
    if findings is not None:
        updates["findings"] = findings
    if error_message is not None:
        updates["error_message"] = error_message
    if status in {"pending", "complete", "error"}:
        updates["updated_at"] = datetime.now(timezone.utc)
    if not updates:
        return
    await db.reviews.update_one({"id": review_id}, {"$set": updates})
