from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException
import logging
import json

from app.models.models import Task, Subtask, DailyTaskPlan, DailyTimePlan
from app.schemas import task as schemas

# ロガーの設定
logger = logging.getLogger(__name__)


def get_task(db: Session, task_id: int) -> Optional[Task]:
    """指定されたIDのタスクを取得する"""
    return db.query(Task).filter(Task.task_id == task_id).first()


def get_tasks(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
    """ユーザーのタスク一覧を取得する"""
    # SQLクエリをログに出力（開発用）
    query = db.query(Task).filter(Task.user_id == user_id).offset(skip).limit(limit)
    sql_statement = str(query.statement.compile(compile_kwargs={"literal_binds": True}))
    logger.info(f"SQL query: {sql_statement}")
    
    # クエリ実行
    tasks = query.all()
    
    # 結果をログに出力
    logger.info(f"User {user_id} tasks retrieved: {len(tasks)} tasks")
    
    # 開発用：タスクがない場合は空のリストを返す
    if not tasks:
        logger.warning(f"No tasks found for user {user_id}")
        return []
    
    # 開発用：タスクの内容をログに出力
    for i, task in enumerate(tasks):
        task_dict = {
            "task_id": task.task_id,
            "user_id": task.user_id,
            "task_name": task.task_name,
            "start_date": task.start_date.isoformat() if task.start_date else None,
            "due_date": task.due_date.isoformat() if task.due_date else None,
        }
        logger.info(f"Task {i+1}: {json.dumps(task_dict)}")
    
    return tasks


def create_task(db: Session, task: schemas.TaskCreate, user_id: int) -> Task:
    """新しいタスクを作成する"""
    # バリデーション
    _validate_task_data(task)

    # トランザクション開始
    try:
        # 1. タスク本体の作成
        db_task = Task(
            user_id=user_id,
            task_name=task.task_name,
            task_content=task.task_content,
            recent_schedule=task.recent_schedule,
            start_date=task.start_date,
            due_date=task.due_date,
            category=task.category,
            target_time=task.target_time,
            comment=task.comment
        )
        db.add(db_task)
        db.flush()  # IDを取得するためにフラッシュ

        # 2. サブタスクの作成
        for subtask_data in task.subtasks:
            db_subtask = Subtask(
                task_id=db_task.task_id,
                subtask_name=subtask_data.subtask_name,
                contribution_value=subtask_data.contribution_value
            )
            db.add(db_subtask)

        # 3. 日次作業計画の作成
        for plan_data in task.daily_task_plans:
            db_plan = DailyTaskPlan(
                task_id=db_task.task_id,
                date=plan_data.date,
                task_plan_value=plan_data.task_plan_value
            )
            db.add(db_plan)

        # 4. 日次時間計画の作成
        for time_plan_data in task.daily_time_plans:
            db_time_plan = DailyTimePlan(
                task_id=db_task.task_id,
                date=time_plan_data.date,
                time_plan_value=time_plan_data.time_plan_value
            )
            db.add(db_time_plan)

        db.commit()
        db.refresh(db_task)
        return db_task
    
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"タスク作成中にエラーが発生しました: {str(e)}")


def update_task(db: Session, task_id: int, task: schemas.TaskUpdate, user_id: int) -> Task:
    """タスクを更新する"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    if db_task.user_id != user_id:
        raise HTTPException(status_code=403, detail="このタスクを更新する権限がありません")

    try:
        # 更新するフィールドを設定（日次計画値は除く）
        update_data = task.dict(exclude_unset=True, exclude={'daily_task_plans', 'daily_time_plans'})
        for key, value in update_data.items():
            setattr(db_task, key, value)

        # 日次作業計画値の更新
        if task.daily_task_plans is not None:
            # 既存の日次作業計画を削除
            db.query(DailyTaskPlan).filter(DailyTaskPlan.task_id == task_id).delete()
            
            # 新しい日次作業計画を作成
            for plan_data in task.daily_task_plans:
                db_plan = DailyTaskPlan(
                    task_id=task_id,
                    date=plan_data.date,
                    task_plan_value=plan_data.task_plan_value
                )
                db.add(db_plan)

        # 日次作業時間計画値の更新
        if task.daily_time_plans is not None:
            # 既存の日次時間計画を削除
            db.query(DailyTimePlan).filter(DailyTimePlan.task_id == task_id).delete()
            
            # 新しい日次時間計画を作成
            for time_plan_data in task.daily_time_plans:
                db_time_plan = DailyTimePlan(
                    task_id=task_id,
                    date=time_plan_data.date,
                    time_plan_value=time_plan_data.time_plan_value
                )
                db.add(db_time_plan)

        db.commit()
        db.refresh(db_task)
        return db_task
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"タスク更新中にエラーが発生しました: {str(e)}")


def delete_task(db: Session, task_id: int, user_id: int) -> Dict[str, Any]:
    """タスクを削除する"""
    db_task = get_task(db, task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    if db_task.user_id != user_id:
        raise HTTPException(status_code=403, detail="このタスクを削除する権限がありません")

    db.delete(db_task)
    db.commit()
    return {"task_id": task_id, "deleted": True}


def _validate_task_data(task: schemas.TaskCreate) -> None:
    """タスクデータのバリデーション"""
    # 1. サブタスクの作業貢献値が合計100かチェック
    subtask_total = sum(subtask.contribution_value for subtask in task.subtasks)
    if subtask_total != 100:
        raise HTTPException(
            status_code=400, 
            detail=f"サブタスクの作業貢献値の合計が100ではありません (現在: {subtask_total})"
        )

    # 2. 日次作業計画値が合計100かチェック
    plan_total = sum(plan.task_plan_value for plan in task.daily_task_plans)
    if not (99.9 <= plan_total <= 100.1):  # 浮動小数点の誤差を考慮
        raise HTTPException(
            status_code=400, 
            detail=f"日次作業計画値の合計が100ではありません (現在: {plan_total})"
        )

    # 3. 日次作業時間計画値が目標作業時間と等しいかチェック
    time_plan_total = sum(plan.time_plan_value for plan in task.daily_time_plans)
    if not (task.target_time * 0.99 <= time_plan_total <= task.target_time * 1.01):  # 浮動小数点の誤差を考慮
        raise HTTPException(
            status_code=400, 
            detail=f"日次作業時間計画値の合計が目標作業時間と一致しません (目標: {task.target_time}, 現在: {time_plan_total})"
        )


def calculate_initial_values(data: schemas.TaskInitialValues) -> Dict[str, Any]:
    """タスク作成時の初期値を計算する"""
    # 日付範囲を生成
    date_range = []
    current_date = data.start_date
    while current_date <= data.due_date:
        date_range.append(current_date)
        current_date += timedelta(days=1)
    
    task_days = len(date_range)
    
    # 1. 日毎の作業計画値の初期値を計算（均等配分）
    daily_task_plan_value = 100 / task_days if task_days > 0 else 0
    daily_task_plans = [
        {"date": d.isoformat(), "task_plan_value": daily_task_plan_value}
        for d in date_range
    ]
    
    # 2. 日毎の作業時間計画値の初期値を計算（均等配分）
    daily_time_plan_value = data.target_time / task_days if task_days > 0 else 0
    daily_time_plans = [
        {"date": d.isoformat(), "time_plan_value": daily_time_plan_value}
        for d in date_range
    ]
    
    # 3. サブタスクの作業貢献値の初期値を計算
    subtask_contribution_value = 100 / data.subtask_count if data.subtask_count > 0 else 0
    
    return {
        "daily_task_plans": daily_task_plans,
        "daily_time_plans": daily_time_plans,
        "subtask_contribution_value": subtask_contribution_value
    } 