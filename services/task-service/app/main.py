from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.api.v1 import tasks, subtasks
from app.core.config import settings
from app.db.session import engine
from app.models import models

# ロギング設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("task-service")
# SQLAlchemyのログを有効化
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="タスク管理サービス",
    description="タスク作成・管理APIサービス",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://localhost:80", "http://localhost:3000", "http://localhost:8080", "http://frontend", "http://frontend:80"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "User-Agent"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=600,
)

# APIルーターの設定
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(subtasks.router, prefix="/api/v1")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "タスク管理サービスAPIへようこそ"} 