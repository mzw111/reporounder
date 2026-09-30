from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import WebSocket

from app.db.redis_client import get_redis

logger = logging.getLogger(__name__)
PUBSUB_CHANNEL_PREFIX = "reporounder:review:"


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = defaultdict(set)
        self.subscription_tasks: dict[str, asyncio.Task[None]] = {}

    async def connect(self, review_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.rooms[review_id].add(websocket)

    def disconnect(self, review_id: str, websocket: WebSocket) -> None:
        room = self.rooms.get(review_id)
        if not room:
            return
        room.discard(websocket)
        if room:
            return
        self.rooms.pop(review_id, None)
        task = self.subscription_tasks.pop(review_id, None)
        if task and not task.done():
            task.cancel()

    async def broadcast_to_room(self, review_id: str, message: dict[str, Any]) -> None:
        payload = json.dumps(message)
        dead_connections: list[WebSocket] = []
        for websocket in list(self.rooms.get(review_id, set())):
            try:
                await websocket.send_text(payload)
            except Exception:  # noqa: BLE001
                dead_connections.append(websocket)
        for websocket in dead_connections:
            self.disconnect(review_id, websocket)

    def ensure_subscription(self, review_id: str) -> None:
        task = self.subscription_tasks.get(review_id)
        if task and not task.done():
            return
        self.subscription_tasks[review_id] = asyncio.create_task(self.subscribe_and_forward(review_id))

    async def subscribe_and_forward(self, review_id: str) -> None:
        redis_client = get_redis()
        pubsub = redis_client.pubsub()
        channel = f"{PUBSUB_CHANNEL_PREFIX}{review_id}"
        try:
            await pubsub.subscribe(channel)
            async for message in pubsub.listen():
                if review_id not in self.rooms:
                    break
                if message.get("type") != "message":
                    continue
                try:
                    event = json.loads(message["data"])
                except (KeyError, TypeError, json.JSONDecodeError):
                    logger.warning("Ignoring malformed collaboration event for %s", review_id)
                    continue
                await self.broadcast_to_room(review_id, event)
        except asyncio.CancelledError:
            raise
        except Exception:  # noqa: BLE001
            logger.exception("Review collaboration subscriber failed for %s", review_id)
        finally:
            try:
                await pubsub.unsubscribe(channel)
                await pubsub.aclose()
            except Exception:  # noqa: BLE001
                logger.debug("Redis pub/sub cleanup failed for %s", review_id, exc_info=True)
            if self.subscription_tasks.get(review_id) is asyncio.current_task():
                self.subscription_tasks.pop(review_id, None)


manager = ConnectionManager()


async def publish_to_review(redis_client: Any, review_id: str, event_type: str, data: dict[str, Any]) -> None:
    event = {"type": event_type, **data}
    await redis_client.publish(f"{PUBSUB_CHANNEL_PREFIX}{review_id}", json.dumps(event))