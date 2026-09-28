from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import settings

_client: AsyncIOMotorClient | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_mongo_db() -> AsyncIOMotorDatabase:
    database = get_mongo_client()[settings.mongo_db]
    return database


async def ensure_review_indexes() -> None:
    db = get_mongo_db()
    await db.reviews.create_index([("user_id", 1), ("created_at", -1), ("status", 1)])


def close_mongo_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
