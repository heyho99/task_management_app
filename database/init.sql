-- コマンドメモ（消さない）
-- docker exec -it task-management-db-1 psql -U postgres -d task_management_db
-- \dt でテーブル一覧確認
-- \d テーブル名 でテーブル詳細確認
-- \c データベース名 でデータベース切り替え
-- \q で抜ける

-- ER図に基づく初期データベースセットアップスクリプト

-- 単一のデータベースを作成（Dockerコンテナでは既に作成済み）
CREATE DATABASE task_management_db;
\c task_management_db;

-- usersテーブル
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- groupsテーブル
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    groupname VARCHAR(255) NOT NULL UNIQUE
);

-- user_groupテーブル
CREATE TABLE user_group (
    user_group_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
);

-- tasksテーブル
CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id), -- 作成者
    task_name VARCHAR(255) NOT NULL,
    task_content TEXT,
    recent_schedule TEXT,
    start_date DATE,
    due_date DATE,
    category VARCHAR(100),
    target_time INTEGER,
    comment TEXT
);

-- task_authテーブル
CREATE TABLE task_auth (
    task_auth_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(group_id) ON DELETE CASCADE, -- null可能
    group_auth VARCHAR(50) NOT NULL CHECK (group_auth IN ('read', 'write', 'admin'))
);

-- daily_task_plansテーブル
CREATE TABLE daily_task_plans (
    daily_task_plan_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    task_plan_value FLOAT NOT NULL,
    UNIQUE(task_id, date)
);

-- subtasksテーブル
CREATE TABLE subtasks (
    subtask_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    subtask_name VARCHAR(255) NOT NULL,
    contribution_value INTEGER
);

-- record_worksテーブル
CREATE TABLE record_works (
    record_work_id SERIAL PRIMARY KEY,
    subtask_id INTEGER NOT NULL REFERENCES subtasks(subtask_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    work INTEGER NOT NULL
);

-- work_timesテーブル
CREATE TABLE work_times (
    work_time_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    work_time INTEGER NOT NULL
);

-- daily_time_plansテーブル
CREATE TABLE daily_time_plans (
    daily_time_plan_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_plan_value FLOAT NOT NULL,
    UNIQUE(task_id, date)
);

-- インデックスの作成
CREATE INDEX idx_user_group_user_id ON user_group(user_id);
CREATE INDEX idx_user_group_group_id ON user_group(group_id);
CREATE INDEX idx_task_auth_task_id ON task_auth(task_id);
CREATE INDEX idx_task_auth_group_id ON task_auth(group_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_daily_task_plans_task_id ON daily_task_plans(task_id);
CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX idx_record_works_subtask_id ON record_works(subtask_id);
CREATE INDEX idx_work_times_task_id ON work_times(task_id);
CREATE INDEX idx_daily_time_plans_task_id ON daily_time_plans(task_id);

-- サンプルデータの挿入（オプション）
INSERT INTO users (username, password) VALUES
('user1', 'hashed_password_1'),
('user2', 'hashed_password_2');

INSERT INTO groups (groupname) VALUES
('開発チーム'),
('マネジメントチーム');

INSERT INTO user_group (user_id, group_id) VALUES
(1, 1),
(2, 2),
(1, 2);

-- 初期設定完了メッセージ
SELECT 'データベースの初期設定が完了しました。' as status; 