from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.core.config import settings
from app.db.mongo import get_mongo_db
from app.db.redis_client import get_redis
from app.services.collab_service import publish_to_review
from app.models.mongo_models import Finding, Review

logger = logging.getLogger(__name__)
ANALYSIS_QUEUE_NAME = "analysis_queue"


class AnalysisResponse(BaseModel):
    findings: list[Finding] = Field(default_factory=list)


async def enqueue_job(review_id: str) -> None:
    redis_client = get_redis()
    payload = json.dumps({"review_id": review_id})
    await redis_client.lpush(ANALYSIS_QUEUE_NAME, payload)
    logger.info("Queued analysis for review %s", review_id)


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


async def process_job(review_id: str) -> None:
    db = get_mongo_db()
    review_document = await db.reviews.find_one({"id": review_id})
    if not review_document:
        logger.warning("Skipped missing review %s", review_id)
        return

    if review_document.get("status") != "pending":
        logger.info("Review %s already in %s state; skipping processing", review_id, review_document.get("status"))
        return

    try:
        ai_response = call_ai(review_document["diff"])
        findings_dicts = [finding.model_dump(mode="json") for finding in ai_response.findings]
        await update_review_status(
            review_id,
            status="complete",
            findings=findings_dicts,
            error_message=None,
        )
        await publish_to_review(
            get_redis(),
            review_id,
            "findings_ready",
            {"finding_count": len(findings_dicts), "review_id": review_id},
        )
        logger.info("Analysis completed for review %s: %d findings", review_id, len(ai_response.findings))
    except Exception as exc:  # noqa: BLE001
        logger.exception("AI analysis failed for review %s", review_id)
        await update_review_status(review_id, status="error", error_message=str(exc))


def call_ai(diff: str) -> AnalysisResponse:
    if settings.ai_provider.lower() != "openai":
        raise ValueError(f"Unsupported AI provider: {settings.ai_provider}")
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is not configured")

    example_json = (
        '{"findings": [{"line_number": 42, "side": "right", "severity": "critical", '
        '"category": "security", "message": "SQL query built with string concatenation — SQL injection risk", '
        '"suggestion": "Use parameterized queries instead"}]}'
    )
    prompt = (
        "Analyze this code diff for security vulnerabilities, complexity/performance problems, bugs, "
        "code quality issues, and anti-patterns. Return ONLY valid JSON in the exact structure: "
        f"{example_json} Do not return markdown, code fences, or explanations outside the JSON.\n\nDIFF:\n{diff}"
    )

    headers = {
        "Authorization": f"Bearer {settings.openai_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": settings.openai_model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0,
        "response_format": {"type": "json_object"},
    }

    try:
        with httpx.Client(timeout=60.0) as client:
            response = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise RuntimeError(f"AI API request failed: {exc}") from exc

    try:
        content = response.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
        validated = AnalysisResponse.model_validate(data)
        return validated
    except (KeyError, TypeError, ValueError, ValidationError) as exc:
        raise ValueError(f"AI response was not valid JSON or did not match the expected schema: {exc}") from exc
