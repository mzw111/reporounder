from __future__ import annotations

import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.security import decode_token
from app.db.mongo import get_mongo_db
from app.db.mysql import get_db
from app.models.sql_models import User
from app.services.collab_service import manager
from app.services.review_service import get_review, save_annotation

router = APIRouter(prefix="/reviews", tags=["collab"])


async def reject(websocket: WebSocket) -> None:
    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)


@router.websocket("/{review_id}/ws")
async def review_collaboration_socket(
    websocket: WebSocket,
    review_id: str,
    db: Session = Depends(get_db),
) -> None:
    token = websocket.query_params.get("token")
    payload = decode_token(token) if token else None
    if not payload or payload.get("type") != "access" or not payload.get("sub"):
        await reject(websocket)
        return

    user = db.get(User, payload["sub"])
    if not user:
        await reject(websocket)
        return
    try:
        await get_review(user, review_id, db)
    except ValueError:
        await reject(websocket)
        return

    await manager.connect(review_id, websocket)
    manager.ensure_subscription(review_id)
    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                continue

            message_type = message.get("type")
            if message_type == "ping":
                await websocket.send_json({"type": "pong"})
            elif message_type == "annotation_add":
                finding_id = message.get("finding_id")
                content = message.get("content")
                if not isinstance(finding_id, str) or not finding_id or not isinstance(content, str) or not content.strip():
                    continue
                annotation = await save_annotation(
                    get_mongo_db(),
                    review_id,
                    finding_id,
                    user.id,
                    user.display_name,
                    content.strip(),
                )
                await manager.broadcast_to_room(
                    review_id,
                    {"type": "annotation_added", "annotation": annotation, "review_id": review_id},
                )
    except WebSocketDisconnect:
        manager.disconnect(review_id, websocket)