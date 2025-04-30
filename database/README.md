# データベース構成

このディレクトリはタスク管理アプリケーションのデータベース関連ファイルを管理します。

## ディレクトリ構造

- `migrations/` - データベースマイグレーションスクリプト
- `init.sql` - 初期データベース作成スクリプト

## データベーススキーマ

アプリケーションは単一のデータベース**task_management_db**を使用し、以下のテーブルが含まれます：

- `users` - ユーザー情報
- `groups` - グループ情報
- `user_group` - ユーザーとグループの関連付け
- `tasks` - タスク情報
- `task_auth` - タスクの権限設定
- `daily_task_plans` - 日次タスク計画
- `subtasks` - サブタスク情報
- `record_works` - 作業記録
- `work_times` - 作業時間の記録
- `daily_time_plans` - 日次時間計画

各テーブルの詳細は `docs/design/er_diagram.md` を参照してください。

## マイグレーション実行方法

開発環境でマイグレーションを実行するには、以下のコマンドを使用します：

```bash
# マイグレーションを作成する
alembic revision --autogenerate -m "Migration message"

# マイグレーションを実行する
alembic upgrade head
```

## データベースの起動方法

Dockerを使用してデータベースを起動するには：

```bash
# プロジェクトのルートディレクトリで実行
docker-compose up db
```

これにより、PostgreSQLデータベースが起動し、`init.sql`スクリプトによって必要なテーブルが自動的に作成されます。 