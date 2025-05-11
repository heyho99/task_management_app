from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import logging

logger = logging.getLogger(__name__)

# 認証サービスとの連携用の設定
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

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