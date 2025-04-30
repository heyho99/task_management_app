# データベース構成

このディレクトリはタスク管理アプリケーションのデータベース関連ファイルを管理します。

## ディレクトリ構造

- `migrations/` - データベースマイグレーションスクリプト
- `init.sql` - 初期データベース作成スクリプト

## データベーススキーマ

アプリケーションは以下のデータベースを使用します：

1. **auth_db** - ユーザー認証関連の情報
   - `users` - ユーザー情報

2. **task_db** - タスク管理関連の情報
   - `tasks` - タスク情報
   - `subtasks` - サブタスク情報
   - `daily_task_plans` - 日次タスク計画
   - `record_works` - 作業記録

3. **time_db** - 時間管理関連の情報
   - `work_times` - 作業時間の記録
   - `daily_time_plans` - 日次時間計画

4. **group_db** - グループと権限管理関連の情報
   - `groups` - グループ情報
   - `user_group` - ユーザーとグループの関連付け
   - `task_auth` - タスクの権限設定

5. **report_db** - レポート関連の情報
   - `reports` - レポート情報

## マイグレーション実行方法

開発環境でマイグレーションを実行するには、以下のコマンドを使用します：

```bash
# マイグレーションを作成する
alembic revision --autogenerate -m "Migration message"

# マイグレーションを実行する
alembic upgrade head
``` 