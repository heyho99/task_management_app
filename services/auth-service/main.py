from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth
from app.db.session import engine, Base

app = FastAPI(title="認証サービス", description="ユーザー認証を管理するマイクロサービス")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 本番環境では適切に制限すること
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# APIルータの設定
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])

# 起動時にデータベースのテーブルを作成
@app.on_event("startup")
async def startup():
    Base.metadata.create_all(bind=engine)

@app.get("/")
async def root():
    return {"message": "認証サービスが正常に動作しています"} 