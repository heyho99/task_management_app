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
# SQLAlchemyのログを有効化（SQLクエリの実行ログなどが確認できるようになる）
logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

# modelsモジュールで定義されたすべてのテーブルが、
# 指定されたengine（データベース接続）に存在しない場合に
# 自動的に作成する
models.Base.metadata.create_all(bind=engine)

# FastAPIアプリケーションのインスタンスを作成（クライアントからのリクエストを受け取ったり、レスポンスを返すためのオブジェクト）
app = FastAPI(
    title="タスク管理サービス",
    description="タスク作成・管理APIサービス",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost", # いらないと思う
        "http://localhost:80", # いらないと思う
        "http://localhost:3000", # いらないと思う
        "http://localhost:8080", # フロントエンド　必要（タスクAPIにリクエスト送信時、フロントエンドのオリジンが付与されるため）
        "http://frontend", # いらないと思う　フロントエンド（内部ネットワーク）はブラウザを経由しないため
        "http://frontend:80" # いらないと思う（ポート省略時:80）
        ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "User-Agent"],
    expose_headers=["Content-Length", "Content-Type"],
    max_age=600,
)

# APIルーターの取り込み
app.include_router(tasks.router, prefix="/api/v1") # ~:8002/api/v1/tasks　のようになる
app.include_router(subtasks.router, prefix="/api/v1") # ~:8002/api/v1/subtasks　のようになる

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "タスク管理サービスAPIへようこそ"} 