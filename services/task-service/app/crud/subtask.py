from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.models import Task, Subtask, RecordWork
from app.schemas import task as schemas


def get_subtask(db: Session, subtask_id: int) -> Optional[Subtask]:
    """指定されたIDのサブタスクを取得する"""
    return db.query(Subtask).filter(Subtask.subtask_id == subtask_id).first()


def get_subtasks(db: Session, task_id: int) -> List[Subtask]:
    """指定されたタスクのサブタスク一覧を取得する"""
    return db.query(Subtask).filter(Subtask.task_id == task_id).all()


def create_subtask(db: Session, subtask: schemas.SubtaskCreate, task_id: int, user_id: int) -> Subtask:
    """新しいサブタスクを作成する"""
    # タスクの存在確認とアクセス権限チェック
    task = db.query(Task).filter(Task.task_id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="このタスクにサブタスクを追加する権限がありません")
    
    # サブタスク作成
    db_subtask = Subtask(
        task_id=task_id,
        subtask_name=subtask.subtask_name,
        contribution_value=subtask.contribution_value,
        completion_rate=0  # 初期値は0
    )
    
    db.add(db_subtask)
    db.commit()
    db.refresh(db_subtask)
    
    # サブタスク作成後に全サブタスクの貢献値合計が100になっているか確認
    validate_subtasks_contribution(db, task_id)
    
    return db_subtask


def update_subtask(db: Session, subtask_id: int, subtask: schemas.SubtaskUpdate, user_id: int) -> Subtask:
    """サブタスクを更新する"""
    db_subtask = get_subtask(db, subtask_id)
    if not db_subtask:
        raise HTTPException(status_code=404, detail="サブタスクが見つかりません")
    
    # タスクの所有者確認
    task = db.query(Task).filter(Task.task_id == db_subtask.task_id).first()
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="このサブタスクを更新する権限がありません")
    
    # 更新するフィールドを設定
    update_data = subtask.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_subtask, key, value)
    
    db.commit()
    db.refresh(db_subtask)
    
    # サブタスク更新後に全サブタスクの貢献値合計が100になっているか確認
    validate_subtasks_contribution(db, db_subtask.task_id)
    
    return db_subtask


def delete_subtask(db: Session, subtask_id: int, user_id: int) -> Dict[str, Any]:
    """サブタスクを削除する"""
    db_subtask = get_subtask(db, subtask_id)
    if not db_subtask:
        raise HTTPException(status_code=404, detail="サブタスクが見つかりません")
    
    # タスクの所有者確認
    task = db.query(Task).filter(Task.task_id == db_subtask.task_id).first()
    if task.user_id != user_id:
        raise HTTPException(status_code=403, detail="このサブタスクを削除する権限がありません")
    
    task_id = db_subtask.task_id
    
    db.delete(db_subtask)
    db.commit()
    
    # サブタスク削除後に残りのサブタスクの貢献値合計が100になっているか確認
    # 残りのサブタスクがある場合のみ
    remaining_subtasks = db.query(Subtask).filter(Subtask.task_id == task_id).all()
    if remaining_subtasks:
        validate_subtasks_contribution(db, task_id)
    
    return {"subtask_id": subtask_id, "deleted": True}


def validate_subtasks_contribution(db: Session, task_id: int) -> None:
    """指定されたタスクの全サブタスクの貢献値合計が100かチェックする"""
    subtasks = db.query(Subtask).filter(Subtask.task_id == task_id).all()
    
    total_contribution = sum(subtask.contribution_value for subtask in subtasks)
    if total_contribution != 100:
        raise HTTPException(
            status_code=400, 
            detail=f"サブタスクの作業貢献値の合計が100ではありません (現在: {total_contribution})"
        ) 