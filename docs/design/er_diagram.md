erDiagram
    users ||--o{ tasks : "作成する"
    users ||--o{ user_group : "所属する"
    groups ||--o{ user_group : "含む"
    groups ||--o{ task_auth : "持つ"
    tasks ||--o{ task_auth : "関連付ける"
    tasks ||--o{ daily_task_plans : "持つ"
    tasks ||--o{ subtasks : "持つ"
    tasks ||--o{ daily_time_plans : "持つ"
    subtasks ||--o{ record_works : "記録する"

    users {
        int user_id PK
        varchar username
        varchar password
    }
    
    groups {
        int group_id PK
        varchar groupname
    }
    
    user_group {
        int user_group_id PK
        int user_id FK
        int group_id FK
    }
    
    task_auth {
        int task_auth_id PK
        int task_id FK
        int group_id FK "null可能"
        varchar group_auth "read/write/admin"
    }
    
    tasks {
        int task_id PK
        int user_id FK "作成者"
        varchar task_name
        text task_content
        text recent_schedule
        date start_date
        date due_date
        varchar category
        int target_time
        text comment
    }
    
    daily_task_plans {
        int daily_task_plan_id PK
        int task_id FK
        date date
        float task_plan_value
    }
    
    subtasks {
        int subtask_id PK
        int task_id FK
        varchar subtask_name
        int contribution_value
    }
    
    record_works {
        int record_work_id PK
        int subtask_id FK
        date date
        int work
        int work_time
    }
    
    daily_time_plans {
        int daily_time_plan_id PK
        int task_id FK
        date date
        float time_plan_value
    }