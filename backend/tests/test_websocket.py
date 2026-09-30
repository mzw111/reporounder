from unittest.mock import AsyncMock, patch

import pytest
from fastapi import WebSocketDisconnect

from app.core.security import create_access_token
from app.models.mongo_models import Review


def test_ws_rejects_missing_token(client):
    with pytest.raises(WebSocketDisconnect) as error:
        with client.websocket_connect("/api/v1/reviews/test123/ws"):
            pass
    assert error.value.code == 1008


def test_ws_rejects_invalid_token(client):
    with pytest.raises(WebSocketDisconnect) as error:
        with client.websocket_connect("/api/v1/reviews/test123/ws?token=badtoken"):
            pass
    assert error.value.code == 1008


def test_ws_ping_pong(client, test_user, test_access_token):
    review = Review(id="test123", user_id=test_user.id, title="Test", diff="diff")
    with patch("app.api.v1.collab_routes.get_review", new=AsyncMock(return_value=review)):
        with client.websocket_connect(f"/api/v1/reviews/test123/ws?token={test_access_token}") as websocket:
            websocket.send_json({"type": "ping"})
            assert websocket.receive_json() == {"type": "pong"}


def test_ws_accepts_valid_token(client, test_user):
    token = create_access_token(test_user.id)
    review = Review(id="test123", user_id=test_user.id, title="Test", diff="diff")
    with patch("app.api.v1.collab_routes.get_review", new=AsyncMock(return_value=review)):
        with client.websocket_connect(f"/api/v1/reviews/test123/ws?token={token}"):
            assert True