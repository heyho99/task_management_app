import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 環境変数からデータベースURLを取得、デフォルト値はローカル開発用
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@host:5432/task_management_db")

# SQLAlchemyエンジンの作成
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# セッションファクトリの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデル定義用のベースクラス
Base = declarative_base()

# 依存性注入用のデータベースセッション取得関数
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 