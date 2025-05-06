# PostgreSQLセットアップと利用手順
# 自宅PC

## セットアップ手順

### 1. PostgreSQLをDockerで起動

```bash
# docker-compose.postgres.ymlを使用してPostgreSQLコンテナを起動
docker-compose -f docker-compose.yml up -d
```

### 2. コンテナの状態確認

```bash
# コンテナが正常に起動していることを確認
docker ps
```

### 3. PostgreSQLコンテナに接続

```bash
# PostgreSQLコンテナにbashで接続
docker exec -it task-management-postgres bash

# PostgreSQLに接続
psql -U postgres
```

## データベース操作コマンド

### 基本的なコマンド

```sql
-- データベース一覧表示
\l

-- テーブル一覧表示
\dt

-- データベース切り替え
\c task_management_db

-- テーブルの詳細表示
\d users
\d tasks
\d groups
-- その他テーブル名を指定

-- PostgreSQLから抜ける
\q

-- コンテナから抜ける
exit
```

### データ確認用クエリ例

```sql
-- ユーザー一覧取得
SELECT * FROM users;

-- グループ一覧取得
SELECT * FROM groups;

-- タスク一覧取得
SELECT * FROM tasks;

-- ユーザーとグループの関連を確認
SELECT u.username, g.groupname 
FROM users u 
JOIN user_group ug ON u.user_id = ug.user_id 
JOIN groups g ON ug.group_id = g.group_id;

-- タスクと担当ユーザーの情報を確認
SELECT t.task_id, t.task_name, u.username, t.category, t.start_date, t.due_date
FROM tasks t
JOIN users u ON t.user_id = u.user_id;

-- サブタスクとその親タスクの情報を確認
SELECT t.task_name, s.subtask_name, s.contribution_value
FROM subtasks s
JOIN tasks t ON s.task_id = t.task_id;

-- 作業記録の確認
SELECT t.task_name, s.subtask_name, rw.date, rw.work
FROM record_works rw
JOIN subtasks s ON rw.subtask_id = s.subtask_id
JOIN tasks t ON s.task_id = t.task_id;
```

## メンテナンス

### コンテナの停止

```bash
# PostgreSQLコンテナの停止
docker-compose -f docker-compose.postgres.yml down
```

### データベースのバックアップ

```bash
# データベースのダンプを作成
docker exec task-management-postgres pg_dump -U postgres task_management_db > backup.sql
```

### データベースの復元

```bash
# ダンプからデータベースを復元
cat backup.sql | docker exec -i task-management-postgres psql -U postgres -d task_management_db
```

## トラブルシューティング

- **接続エラーが発生する場合**: コンテナが正常に起動しているか確認し、必要に応じて再起動する
- **初期化スクリプトが実行されない場合**: volumesの設定を確認し、必要に応じてボリュームを削除してから再起動する
- **ポートの競合が発生する場合**: docker-compose.postgres.ymlのポート設定を変更する 