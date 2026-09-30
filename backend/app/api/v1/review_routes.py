from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.models.sql_models import User
from app.db.mysql import get_db
from app.schemas.review import CreateReviewRequest, ReviewResponse, ReviewStatusResponse
from app.services.review_service import create_review, get_review, get_review_status, list_reviews
from app.services.team_service import TeamError

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review_route(
    payload: CreateReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        review = await create_review(current_user, payload, db)
    except TeamError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return ReviewResponse(
        id=review.id,
        title=review.title,
        diff=review.diff,
        team_id=review.team_id,
        status=review.status,
        findings=review.findings,
        annotations=review.annotations,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get("", response_model=list[ReviewResponse])
async def list_reviews_route(
    team_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        reviews = await list_reviews(current_user, db, team_id)
    except TeamError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    return [
        ReviewResponse(
            id=review.id,
            title=review.title,
            diff=review.diff,
            team_id=review.team_id,
            status=review.status,
            findings=review.findings,
            annotations=review.annotations,
            created_at=review.created_at,
            updated_at=review.updated_at,
        )
        for review in reviews
    ]


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review_route(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        review = await get_review(current_user, review_id, db)
    except (ValueError, TeamError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return ReviewResponse(
        id=review.id,
        title=review.title,
        diff=review.diff,
        team_id=review.team_id,
        status=review.status,
        findings=review.findings,
        annotations=review.annotations,
        created_at=review.created_at,
        updated_at=review.updated_at,
    )


@router.get("/{review_id}/status", response_model=ReviewStatusResponse)
async def get_review_status_route(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        status_value = await get_review_status(current_user, review_id, db)
    except (ValueError, TeamError) as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return ReviewStatusResponse(status=status_value)
