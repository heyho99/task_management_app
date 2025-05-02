-- コマンドメモ（消さない）
-- 
-- \dt でテーブル一覧確認
-- \d テーブル名 でテーブル詳細確認
-- \c データベース名 でデータベース切り替え
-- \q で抜ける

-- ER図に基づく初期データベースセットアップスクリプト

-- 単一のデータベースを作成
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

-- サンプルデータの挿入
-- ユーザーデータ
INSERT INTO users (username, password) VALUES
('user1', 'hashed_password_1'),
('user2', 'hashed_password_2'),
('admin', 'hashed_password_admin'),
('tester', 'hashed_password_tester');

-- グループデータ
INSERT INTO groups (groupname) VALUES
('開発チーム'),
('マネジメントチーム'),
('テストチーム'),
('デザインチーム');

-- ユーザーとグループの関連付け
INSERT INTO user_group (user_id, group_id) VALUES
(1, 1), -- user1 が 開発チーム に所属
(2, 2), -- user2 が マネジメントチーム に所属
(1, 2), -- user1 が マネジメントチーム にも所属
(3, 1), -- admin が 開発チーム に所属
(3, 2), -- admin が マネジメントチーム に所属
(3, 3), -- admin が テストチーム に所属
(4, 3); -- tester が テストチーム に所属

-- タスクデータ
INSERT INTO tasks (user_id, task_name, task_content, recent_schedule, start_date, due_date, category, target_time, comment) VALUES
(1, 'バックエンド開発', 'APIの設計と実装', '毎日2時間の作業', '2023-01-01', '2023-01-31', '開発', 60, '優先度高'),
(2, 'プロジェクト管理', 'タスク割り当てとスケジュール管理', '週次ミーティング', '2023-01-05', '2023-02-28', '管理', 30, '毎週金曜日に進捗確認'),
(1, 'フロントエンド開発', 'UIコンポーネントの作成', '週3日の作業', '2023-01-10', '2023-01-25', '開発', 40, ''),
(3, 'セキュリティ監査', 'システム全体のセキュリティチェック', '月次レビュー', '2023-02-01', '2023-02-15', 'セキュリティ', 20, '外部監査と連携'),
(4, 'テスト実施', '機能テストと回帰テスト', '毎日4時間', '2023-01-15', '2023-02-15', 'テスト', 80, 'テスト結果を文書化');

-- タスク権限設定
INSERT INTO task_auth (task_id, group_id, group_auth) VALUES
(1, 1, 'admin'), -- バックエンド開発タスクに対して開発チームがadmin権限
(1, 3, 'read'),  -- バックエンド開発タスクに対してテストチームがread権限
(2, 2, 'admin'), -- プロジェクト管理タスクに対してマネジメントチームがadmin権限
(3, 1, 'write'), -- フロントエンド開発タスクに対して開発チームがwrite権限
(4, 3, 'write'), -- セキュリティ監査タスクに対してテストチームがwrite権限
(5, 3, 'admin'); -- テスト実施タスクに対してテストチームがadmin権限

-- サブタスクデータ
INSERT INTO subtasks (task_id, subtask_name, contribution_value) VALUES
(1, 'データベース設計', 30),
(1, 'API設計', 40),
(1, 'テスト作成', 30),
(2, 'リソース割り当て', 50),
(2, '進捗管理', 50),
(3, 'コンポーネント設計', 40),
(3, 'レスポンシブ対応', 30),
(3, '単体テスト', 30),
(4, '脆弱性診断', 60),
(4, 'セキュリティパッチ適用', 40),
(5, '機能テスト', 50),
(5, '回帰テスト', 50);

-- 日次タスク計画
INSERT INTO daily_task_plans (task_id, date, task_plan_value) VALUES
(1, '2023-01-05', 0.2),
(1, '2023-01-06', 0.3),
(2, '2023-01-07', 0.1),
(3, '2023-01-12', 0.4),
(4, '2023-02-02', 0.5),
(5, '2023-01-16', 0.2);

-- 実績記録
INSERT INTO record_works (subtask_id, date, work) VALUES
(1, '2023-01-05', 3),
(2, '2023-01-06', 4),
(4, '2023-01-07', 2),
(6, '2023-01-12', 5),
(9, '2023-02-02', 6),
(11, '2023-01-16', 4);

-- 作業時間記録
INSERT INTO work_times (task_id, date, work_time) VALUES
(1, '2023-01-05', 120),
(1, '2023-01-06', 180),
(2, '2023-01-07', 90),
(3, '2023-01-12', 150),
(4, '2023-02-02', 240),
(5, '2023-01-16', 200);

-- 日次時間計画
INSERT INTO daily_time_plans (task_id, date, time_plan_value) VALUES
(1, '2023-01-05', 2.0),
(1, '2023-01-06', 3.0),
(2, '2023-01-07', 1.5),
(3, '2023-01-12', 2.5),
(4, '2023-02-02', 4.0),
(5, '2023-01-16', 3.5);

-- 初期設定完了メッセージ
SELECT 'データベースの初期設定が完了しました。' as status; 