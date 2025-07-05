## 全体構造

task-service/
├── app/                     # メインアプリケーションコード
│   ├── __init__.py          # Pythonパッケージ識別
│   ├── main.py              # FastAPIアプリケーションのメインエントリーポイント
│   ├── api/                 # APIエンドポイント（REST API）
│   ├── core/                # アプリケーション設定・共通機能
│   ├── crud/                # データベース操作ロジック（Create, Read, Update, Delete）
│   ├── db/                  # データベースセッション管理
│   ├── models/              # SQLAlchemyデータベースモデル
│   └── schemas/             # Pydanticデータ検証スキーマ
├── docker-compose.yml       # Docker Compose設定
├── Dockerfile              # コンテナビルド設定
└── requirements.txt        # Python依存ライブラリ

## データフロー

【アプリケーション起動時】
1. uvicornがWebサーバーとして`app/main.py`を実行開始
2. main.py内で以下の初期化処理を順次実行：
   - `app.models.models`モジュール読み込み → DBテーブル定義を読み込み
   - `models.Base.metadata.create_all(bind=engine)`実行 → DBにテーブルを自動作成
   - FastAPIアプリケーションインスタンス作成（タイトル・説明・バージョン設定）
   - CORSMiddleware追加 → フロントエンドからのクロスオリジンリクエストを許可
3. APIルーター登録：
   - `api.v1.tasks(subtasks)`モジュールの`router`を`/api/v1/tasks(subtasks)/`プレフィックスで登録
   - `crud.task(subtask)`の関数を、`api.v1.tasks(subtasks)`でエンドポイントと関連付け
4. サーバー起動完了 → ポート8002でHTTPリクエスト受付開始

【リクエスト処理時】
1. HTTPリクエスト受信 → uvicornが`app/main.py`のFastAPIアプリケーションインスタンスにリクエストを転送
2. URLルーティング処理：
   - `/api/v1/tasks/*`パス → `app.api.v1.tasks`モジュールの`router`へルーティング
   - `/api/v1/subtasks/*`パス → `app.api.v1.subtasks`モジュールの`router`へルーティング
   - 該当するエンドポイント関数（例：`get_tasks()`, `create_task()`）を特定・実行開始
3. 依存関数の自動実行（FastAPIのDependsシステム）：
   - `get_db()` → `app.db.session`モジュールでSQLAlchemyのDBセッション作成・取得
   - `get_current_user()` → `app.core.deps`モジュールでJWTトークン検証・ユーザーID取得
4. 入力データ検証 → `app.schemas.task`モジュールのPydanticスキーマでリクエストボディを自動検証
5. ビジネスロジック実行 → エンドポイント関数が`app.crud.task`または`app.crud.subtask`モジュールの関数を呼び出し
6. データベースアクセス → CRUD関数内で`app.models.models`モジュールのSQLAlchemyモデル（Task, Subtaskクラス等）を使用してSQL実行
7. レスポンス変換 → SQLAlchemyモデルオブジェクトを`app.schemas.task`モジュールのPydanticスキーマに変換
8. HTTPレスポンス送信 → FastAPIが自動的にJSONシリアライズしてクライアントへレスポンス返却

## 各モジュールの解説

1. main.py - アプリケーションエントリーポイント
役割: FastAPIアプリケーションの初期化・設定
主な機能:
CORS設定（フロントエンドとの通信許可）
APIルーターの登録（tasks, subtasks）
データベーステーブルの自動作成
ロギング設定

2. api/v1/ - APIエンドポイント層
tasks.py: タスクに関するAPIエンドポイント
GET /tasks/ - タスク一覧取得
GET /tasks/{task_id} - 特定タスク取得
POST /tasks/ - タスク作成
PUT /tasks/{task_id} - タスク更新
DELETE /tasks/{task_id} - タスク削除
POST /tasks/calculate-initial-values - 初期値計算
subtasks.py: サブタスクに関するAPIエンドポイント
GET /subtasks/task/{task_id} - タスクのサブタスク一覧取得
GET /subtasks/{subtask_id} - 特定サブタスク取得
POST /subtasks/task/{task_id} - サブタスク作成
PUT /subtasks/{subtask_id} - サブタスク更新
DELETE /subtasks/{subtask_id} - サブタスク削除

3. models/models.py - データベースモデル
データベーステーブル定義（SQLAlchemy ORM使用）:
Task: メインタスクテーブル
Subtask: サブタスクテーブル
DailyTaskPlan: 日次作業計画テーブル
DailyTimePlan: 日次時間計画テーブル
RecordWork: 作業記録テーブル
リレーションシップ: テーブル間の関連を定義
1つのタスクに複数のサブタスクが紐づく（1:N関係）
カスケード削除設定（タスク削除時に関連データも削除）

4. schemas/task.py - データ検証スキーマ
Pydanticモデルを使用してAPI入出力のデータ検証
主要スキーマ:
TaskCreate: タスク作成時の入力検証
TaskUpdate: タスク更新時の入力検証
Task: タスク情報のレスポンス
SubtaskCreate, SubtaskUpdate, Subtask: サブタスク関連
TaskInitialValues: 初期値計算用
バリデーション機能:
due_dateがstart_dateより後であることの検証
貢献値（0-100）の範囲チェック

5. crud/ - データベース操作層
task.py: タスクのCRUD操作
get_task(): 単一タスク取得
get_tasks(): ユーザーのタスク一覧取得
create_task(): 新規タスク作成（サブタスク・計画値含む）
update_task(): タスク更新
delete_task(): タスク削除
_validate_task_data(): データ整合性チェック
subtask.py: サブタスクのCRUD操作
サブタスクの作成・取得・更新・削除
権限チェック機能

6. core/ - アプリケーション設定・共通機能
config.py: アプリケーション設定
データベース接続URL
JWT認証設定
プロジェクト名などの基本設定
deps.py: 依存関係管理
get_current_user(): 現在のユーザーID取得（認証）
OAuth2設定（仮実装）

7. db/session.py - データベースセッション管理
役割: SQLAlchemyのセッション管理
主な機能:
データベースエンジンの作成
セッションファクトリーの設定
ベースモデルクラスの定義
get_db(): APIエンドポイントで使用するDBセッション依存関数

8. requirements.txt - Python依存ライブラリ
主要なライブラリ：
fastapi: Webフレームワーク
pydantic: データ検証
sqlalchemy: ORM
psycopg2-binary: PostgreSQL接続
uvicorn: ASGIサーバー
alembic: データベースマイグレーション

9. Docker設定
Dockerfile: Python 3.9ベースのコンテナ
docker-compose.yml:
ポート8002でサービス公開
PostgreSQLデータベースとの接続設定
開発用ボリュームマウント

