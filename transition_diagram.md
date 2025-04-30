flowchart TD
    Login[ログイン画面] --> Top[トップページ]
    
    %% ダッシュボードからのメイン遷移
    Sidebar[サイドバー] --> TaskList[タスクページ]
    Sidebar --> TimeList[時間ページ]
    Sidebar --> WorkList[実績入力ページ]
    Sidebar --> Top

    %% タスク一覧からの遷移
    TaskList --> TaskDetail[タスク詳細ページ]
    TaskList --> TaskUpdate[タスク更新ページ]
    TaskList --> TaskDelete[タスク削除ページ]
    TaskList --> TaskCreate[タスク作成ページ]
    
    TimeList --> TaskDetail[タスク詳細ページ]

    WorkList --> TimeUpdate[作業時間修正ページ]
    WorkList --> TimeDelete[作業時間削除ページ]
    WorkList --> WorkUpdate[作業実績修正ページ]
    WorkList --> WorkDelete[作業実績削除ページ]
    WorkList --> Workinput[作業実績入力ページ]
    WorkList --> Timeinput[作業時間入力ページ]
    
    Top["
            <b>トップページ</b>
            ・合算のタスク進捗率（グラフ）
            ・合算のタスク時間進捗率（グラフ）
            ・ガントチャートみたいなスケジュールのグラフ
        "]
    TaskList["
            <b>タスクページ</b>
            ・タスク一覧（グラフ、内容、修正削除ボタン）
            ・タスク作成ボタン
        "]
    TimeList["
            <b>時間ページ</b>
            ・タスク時間一覧（グラフ、内容）
        "]
    WorkList["
        <b>実績入力ページ</b>
        ・作業実績履歴（内容、修正削除ボタン）
        ・時間実績履歴（内容、修正削除ボタン）
    "]
    
    %% スタイル設定
    classDef primary fill:#4285F4,stroke:#333,stroke-width:1px,color:white
    classDef secondary fill:#34A853,stroke:#333,stroke-width:1px,color:white
    classDef createupdate fill:#FBBC05,stroke:#333,stroke-width:1px,color:white
    classDef danger fill:#EA4335,stroke:#333,stroke-width:1px,color:white
    
    class Login,Sidebar,Top primary
    class TaskList,TimeList,WorkList secondary
    class TaskUpdate,WorkUpdate,TimeUpdate,TaskCreate,Workinput,Timeinput createupdate
    class WorkDelete,TimeDelete,TaskDelete danger