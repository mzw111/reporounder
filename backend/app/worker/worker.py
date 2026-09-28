from __future__ import annotations

import asyncio
import json
import logging

from redis.exceptions import TimeoutError as RedisTimeoutError

from app.db.redis_client import get_redis
from app.services.analysis_service import process_job

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


async def run_worker() -> None:
    redis_client = get_redis()
    logger.info("Starting Redis analysis worker")
    while True:
        try:
            job = await redis_client.brpop("analysis_queue", timeout=5)
        except RedisTimeoutError:
            continue
        if not job:
            continue
        _, payload = job
        try:
            message = json.loads(payload)
            review_id = message.get("review_id")
            if not review_id:
                logger.warning("Skipping malformed job payload: %s", payload)
                continue
            await process_job(review_id)
        except Exception:  # noqa: BLE001
            logger.exception("Worker failed to process queued review job: %s", payload)


if __name__ == "__main__":
    asyncio.run(run_worker())
