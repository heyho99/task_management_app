from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import logging

from app.crud import task as crud
from app.schemas import task as schemas
from app.db.session import get_db
from app.models.models import Task, Subtask, DailyTaskPlan, DailyTimePlan

# TODO: 認証関連は認証サービスと連携する必要があるため、仮実装
from app.db.session import get_db, get_current_user

# SQLクエリのデバッグ情報保存用
last_sql_query = ""
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=List[schemas.Task])
def get_tasks(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    ユーザーのタスク一覧を取得する
    """
    global last_sql_query
    
    # デバッグ: ユーザーIDの確認
    logger.info(f"現在のユーザーID: {current_user_id}")
    
    # データベース内のすべてのタスクを出力（デバッグ用）
    all_tasks = db.query(Task).all()
    logger.info(f"データベース内のタスク総数: {len(all_tasks)}")
    for task in all_tasks:
        logger.info(f"DB内タスク: ID={task.task_id}, ユーザーID={task.user_id}, 名前={task.task_name}")
    
    # SQLクエリの取得とタスク一覧取得（SQLクエリはログにも出力されます）
    query = db.query(Task).filter(Task.user_id == current_user_id).offset(skip).limit(limit)
    last_sql_query = str(query.statement.compile(compile_kwargs={"literal_binds": True}))
    logger.info(f"Task list SQL query: {last_sql_query}")
    
    # タスクデータの取得
    db_tasks = crud.get_tasks(db, user_id=current_user_id, skip=skip, limit=limit)
    
    # SQLAlchemyモデルをPydanticモデルに変換する
    tasks = []
    for db_task in db_tasks:
        # サブタスクを取得
        subtasks_db = db.query(Subtask).filter(Subtask.task_id == db_task.task_id).all()
        
        # 作業実績集計をimport
        from app.crud import record_work as crud_record_work
        
        subtasks = []
        for subtask in subtasks_db:
            # サブタスクの作業実績集計を取得
            work_summary = crud_record_work.get_subtask_work_summary(db, subtask.subtask_id)
            progress = crud_record_work.get_subtask_progress(db, subtask.subtask_id)
            
            subtask_model = schemas.Subtask(
                subtask_id=subtask.subtask_id,
                task_id=subtask.task_id,
                subtask_name=subtask.subtask_name,
                contribution_value=subtask.contribution_value,
                progress=progress,
                total_work=work_summary["total_work"],
                total_work_time=work_summary["total_work_time"],
                work_days=work_summary["work_days"]
            )
            subtasks.append(subtask_model)
        
        # タスクの作業実績集計を取得
        task_work_summary = crud_record_work.get_task_work_summary(db, db_task.task_id)
        
        # タスクをPydanticモデルに変換
        task = schemas.Task(
            task_id=db_task.task_id,
            user_id=db_task.user_id,
            task_name=db_task.task_name,
            task_content=db_task.task_content,
            recent_schedule=db_task.recent_schedule,
            start_date=db_task.start_date,
            due_date=db_task.due_date,
            category=db_task.category,
            target_time=db_task.target_time,
            comment=db_task.comment,
            progress=0,  # 現時点では進捗は0固定
            subtasks=subtasks,
            total_work_time=task_work_summary["total_work_time"]
        )
        
        tasks.append(task)
    
    return tasks


@router.get("/debug-sql", response_model=Dict[str, str])
def get_debug_sql(
    current_user_id: int = Depends(get_current_user)
):
    """
    直近のSQLクエリを取得する（開発用）
    """
    global last_sql_query
    return {"sql": last_sql_query or "SQLクエリの情報がありません"}


@router.get("/debug-all-tasks", response_model=List[Dict[str, Any]])
def get_debug_all_tasks(
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    デバッグ用：すべてのタスクを取得する
    """
    all_tasks = db.query(Task).all()
    result = []
    for task in all_tasks:
        result.append({
            "task_id": task.task_id,
            "user_id": task.user_id,
            "task_name": task.task_name,
            "start_date": str(task.start_date),
            "due_date": str(task.due_date),
            "category": task.category
        })
    return result


@router.get("/{task_id}", response_model=schemas.Task)
def get_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたIDのタスクを取得する
    """
    db_task = crud.get_task(db, task_id=task_id)
    if db_task is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    
    # ユーザーの権限確認（仮実装）
    if db_task.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="このタスクへのアクセス権限がありません")
    
    # サブタスクを取得
    subtasks_db = db.query(Subtask).filter(Subtask.task_id == task_id).all()
    
    # 作業実績集計をimport
    from app.crud import record_work as crud_record_work
    
    subtasks = []
    for subtask in subtasks_db:
        # サブタスクの作業実績集計を取得
        work_summary = crud_record_work.get_subtask_work_summary(db, subtask.subtask_id)
        progress = crud_record_work.get_subtask_progress(db, subtask.subtask_id)
        
        subtask_model = schemas.Subtask(
            subtask_id=subtask.subtask_id,
            task_id=subtask.task_id,
            subtask_name=subtask.subtask_name,
            contribution_value=subtask.contribution_value,
            progress=progress,
            total_work=work_summary["total_work"],
            total_work_time=work_summary["total_work_time"],
            work_days=work_summary["work_days"]
        )
        subtasks.append(subtask_model)
    
    # タスクの作業実績集計を取得
    task_work_summary = crud_record_work.get_task_work_summary(db, task_id)
    
    # 日次作業計画値を取得
    daily_task_plans_db = db.query(DailyTaskPlan).filter(DailyTaskPlan.task_id == task_id).all()
    daily_task_plans = [
        schemas.DailyTaskPlan(
            daily_task_plan_id=plan.daily_task_plan_id,
            task_id=plan.task_id,
            date=plan.date,
            task_plan_value=plan.task_plan_value
        )
        for plan in daily_task_plans_db
    ]
    
    # 日次作業時間計画値を取得
    daily_time_plans_db = db.query(DailyTimePlan).filter(DailyTimePlan.task_id == task_id).all()
    daily_time_plans = [
        schemas.DailyTimePlan(
            daily_time_plan_id=plan.daily_time_plan_id,
            task_id=plan.task_id,
            date=plan.date,
            time_plan_value=plan.time_plan_value
        )
        for plan in daily_time_plans_db
    ]
    
    # Pydanticモデルに変換
    task = schemas.Task(
        task_id=db_task.task_id,
        user_id=db_task.user_id,
        task_name=db_task.task_name,
        task_content=db_task.task_content,
        recent_schedule=db_task.recent_schedule,
        start_date=db_task.start_date,
        due_date=db_task.due_date,
        category=db_task.category,
        target_time=db_task.target_time,
        comment=db_task.comment,
        progress=0,  # 現時点では進捗は0固定
        subtasks=subtasks,
        daily_task_plans=daily_task_plans,
        daily_time_plans=daily_time_plans,
        total_work_time=task_work_summary["total_work_time"]
    )
    
    return task


@router.post("/", response_model=schemas.Task)
def create_task(
    task: schemas.TaskCreate, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    新しいタスクを作成する
    """
    return crud.create_task(db=db, task=task, user_id=current_user_id)


@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int, 
    task: schemas.TaskUpdate, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたIDのタスクを更新する
    """
    return crud.update_task(db=db, task_id=task_id, task=task, user_id=current_user_id)


@router.delete("/{task_id}", response_model=Dict[str, Any])
def delete_task(
    task_id: int, 
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたIDのタスクを削除する
    """
    return crud.delete_task(db=db, task_id=task_id, user_id=current_user_id)


@router.post("/calculate-initial-values", response_model=Dict[str, Any])
def calculate_initial_values(
    data: schemas.TaskInitialValues,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    タスク作成時の初期値を計算する
    """
    return crud.calculate_initial_values(data=data) 