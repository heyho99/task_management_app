from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1 import tasks, subtasks
from app.core.config import settings
from app.db.session import engine
from app.models import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="タスク管理サービス",
    description="タスク作成・管理APIサービス",
    version="1.0.0"
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限すること
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルーターの設定
app.include_router(tasks.router, prefix="/api/v1")
app.include_router(subtasks.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "タスク管理サービスAPIへようこそ"} 