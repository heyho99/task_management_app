from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from typing import Optional
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# 認証サービスとの連携用の設定
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# SQLAlchemyエンジン（セッション）の作成
engine = create_engine(settings.DATABASE_URL)

# セッションファクトリーの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# モデルのベースクラス
# このBaseクラスを継承することで、DBのテーブルを作成できる
Base = declarative_base()

# DBセッションの依存関係
# 呼び出し側の引数で、Depends(get_db)と呼ぶことで、dbの処理を実行した後、db.close()を実行してくれる
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 仮実装: 実際の認証サービスとの連携はここで行う
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)) -> int:
    """
    現在のユーザーIDを取得する（仮実装）
    実際のシステムでは認証サービスとの連携が必要
    """
    # デバッグ: トークンを出力
    logger.info(f"受信したトークン: {token}")
    
    # 仮実装: JWTトークンの検証やユーザー情報の取得は認証サービスで行われる
    # ここでは、トークンがあれば固定のユーザーIDを返す
    if not token:
        logger.warning("トークンが提供されていません")
        return 1  # 開発中は認証なしでもアクセス可能にする
    
    # 開発用: どんなトークンでもアクセスを許可する
    logger.info("認証成功: ユーザーID=1を返します")
    return 1  # 固定のユーザーID

# 開発用: トークンなしでも使えるテスト用の認証関数
async def get_test_user() -> int:
    """
    テスト用の固定ユーザーIDを返す
    """
    return 1  # テスト用固定ユーザーID 