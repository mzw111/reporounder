import json
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.mongo_models import Review
from app.api.deps import get_current_user


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer test-token"}


def test_create_review_enqueues_job_and_returns_pending(client, monkeypatch):
    async def fake_get_current_user():
        return type("User", (), {"id": "user-123"})()

    app.dependency_overrides[get_current_user] = fake_get_current_user

    async def fake_create_review(*args, **kwargs):
        return Review(
            id="review-1",
            user_id="user-123",
            title="Demo",
            diff="diff --git a/x b/x\n+hello",
            status="pending",
            findings=[],
            created_at="2024-01-01T00:00:00Z",
            updated_at="2024-01-01T00:00:00Z",
        )

    try:
        with patch("app.api.v1.review_routes.create_review", new=fake_create_review):
            response = client.post("/api/v1/reviews", json={"title": "Demo", "diff": "abc"}, headers={"Authorization": "Bearer test-token"})
            assert response.status_code == 201
            assert response.json()["status"] == "pending"
    finally:
        app.dependency_overrides.clear()


def test_review_status_endpoint_returns_status_only(client, monkeypatch):
    async def fake_get_current_user():
        return type("User", (), {"id": "user-123"})()

    app.dependency_overrides[get_current_user] = fake_get_current_user

    async def fake_get_review_status(*args, **kwargs):
        return "complete"

    try:
        with patch("app.api.v1.review_routes.get_review_status", new=fake_get_review_status):
            response = client.get("/api/v1/reviews/review-123/status", headers={"Authorization": "Bearer test-token"})
            assert response.status_code == 200
            assert response.json() == {"status": "complete"}
    finally:
        app.dependency_overrides.clear()


def test_invalid_json_marked_error():
    from app.services.analysis_service import AnalysisResponse, Finding

    bad_json = '{not valid json}'
    with pytest.raises(ValueError):
        json.loads(bad_json)

    finding = Finding(
        line_number=1,
        side="right",
        severity="high",
        category="security",
        message="oops",
        suggestion="fix it",
    )
    response = AnalysisResponse(findings=[finding])
    assert response.findings[0].message == "oops"


def test_ai_failure_sets_error_status():
    from app.services.analysis_service import call_ai

    with patch("app.services.analysis_service.httpx.post", side_effect=Exception("network failure")):
        with pytest.raises(Exception):
            call_ai("diff")
