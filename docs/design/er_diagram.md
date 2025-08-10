erDiagram
    users {
        INT user_id PK
        VARCHAR username
        VARCHAR password
    }

    groups {
        INT group_id PK
        VARCHAR groupname
    }

    user_group {
        INT user_group_id PK
        INT user_id FK
        INT group_id FK
    }

    tasks {
        INT task_id PK
        INT user_id FK "タスク作成者"
        VARCHAR task_name
        TEXT task_content
        TEXT recent_schedule
        TEXT incident
        DATE start_date
        DATE due_date
        VARCHAR category
        INT target_time "目標作業時間"
    }

    task_auth {
        INT task_auth_id PK
        INT task_id FK "対象タスク"
        INT group_id FK "権限付与グループ (null可)"
        VARCHAR group_auth "read,write,admin"
    }

    daily_task_plans {
        INT daily_task_plan_id PK
        INT task_id FK
        DATE date
        FLOAT task_plan_value "日毎の作業計画値"
    }

    subtasks {
        INT subtask_id PK
        INT task_id FK
        VARCHAR subtask_name
        INT actual_value "作業実績値"
        FLOAT completion_rate "完了率 (0-100)"
    }

    work_times {
        INT work_time_id PK
        INT task_id FK
        DATE date "作業日"
        INT work_time "作業時間実績"
    }

    daily_time_plans {
        INT daily_time_plan_id PK
        INT task_id FK
        DATE date
        FLOAT time_plan_value "日毎の作業時間計画値"
    }

    users ||--o{ user_group : "参加"
    groups ||--o{ user_group : "所属"
    users ||--o{ tasks : "作成"
    tasks ||--|| task_auth : "権限を持つ"
    groups ||--o{ task_auth : "権限を付与される"
    tasks ||--o{ daily_task_plans : "日毎作業計画を持つ"
    tasks ||--o{ subtasks : "サブタスクを持つ"
    tasks ||--o{ work_times : "作業時間実績を持つ"
    tasks ||--o{ daily_time_plans : "日毎時間計画を持つ"