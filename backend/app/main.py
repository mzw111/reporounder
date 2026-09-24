from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth_routes import router as auth_router
from app.api.v1.health import router as health_router
from app.core.config import settings
from app.db.mongo import close_mongo_client, get_mongo_client
from app.db.mysql import Base, engine
from app.db.redis_client import close_redis, get_redis
from app.models import sql_models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    mongo_client = get_mongo_client()
    await mongo_client.admin.command("ping")
    redis_client = get_redis()
    await redis_client.ping()
    print("All database connections established")
    yield
    close_mongo_client()
    await close_redis()
    print("Connections closed")


app = FastAPI(
    title="RepoRounder API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
