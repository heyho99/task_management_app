from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

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