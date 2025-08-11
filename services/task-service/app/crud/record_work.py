from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from app.models.models import RecordWork
from app.schemas.task import RecordWorkCreate, RecordWorkUpdate


def get_record_work(db: Session, record_work_id: int) -> Optional[RecordWork]:
    """作業記録を取得"""
    return db.query(RecordWork).filter(RecordWork.record_work_id == record_work_id).first()


def get_record_works_by_subtask(db: Session, subtask_id: int) -> List[RecordWork]:
    """サブタスクIDで作業記録一覧を取得"""
    return db.query(RecordWork).filter(RecordWork.subtask_id == subtask_id).order_by(RecordWork.date.desc()).all()


def get_record_work_by_subtask_and_date(db: Session, subtask_id: int, work_date: date) -> Optional[RecordWork]:
    """サブタスクIDと日付で作業記録を取得"""
    return db.query(RecordWork).filter(
        and_(RecordWork.subtask_id == subtask_id, RecordWork.date == work_date)
    ).first()


def create_record_work(db: Session, record_work: RecordWorkCreate, subtask_id: int) -> RecordWork:
    """作業記録を作成（作業量と時間を統合）"""
    # 同じ日付の記録が既に存在する場合はエラー
    existing = get_record_work_by_subtask_and_date(db, subtask_id, record_work.date)
    if existing:
        raise ValueError(f"日付 {record_work.date} の作業記録は既に存在します")
    
    db_record_work = RecordWork(
        subtask_id=subtask_id,
        date=record_work.date,
        work=record_work.work,
        work_time=record_work.work_time or 0
    )
    db.add(db_record_work)
    db.commit()
    db.refresh(db_record_work)
    return db_record_work


def update_record_work(db: Session, record_work_id: int, record_work_update: RecordWorkUpdate) -> Optional[RecordWork]:
    """作業記録を更新"""
    db_record_work = get_record_work(db, record_work_id)
    if not db_record_work:
        return None
    
    update_data = record_work_update.dict(exclude_unset=True)
    
    # 日付を変更する場合、同じ日付の記録が既に存在しないかチェック
    if 'date' in update_data and update_data['date'] != db_record_work.date:
        existing = get_record_work_by_subtask_and_date(db, db_record_work.subtask_id, update_data['date'])
        if existing and existing.record_work_id != record_work_id:
            raise ValueError(f"日付 {update_data['date']} の作業記録は既に存在します")
    
    for field, value in update_data.items():
        setattr(db_record_work, field, value)
    
    db.commit()
    db.refresh(db_record_work)
    return db_record_work


def delete_record_work(db: Session, record_work_id: int) -> bool:
    """作業記録を削除"""
    db_record_work = get_record_work(db, record_work_id)
    if not db_record_work:
        return False
    
    db.delete(db_record_work)
    db.commit()
    return True


def get_subtask_progress(db: Session, subtask_id: int) -> int:
    """サブタスクの進捗率を計算（作業記録の合計）"""
    total_work = db.query(RecordWork).filter(RecordWork.subtask_id == subtask_id).with_entities(
        func.sum(RecordWork.work)
    ).scalar()
    
    if total_work is None:
        return 0
    
    # 進捗率は最大100%とする
    return min(total_work, 100)


def get_total_work_time_by_task(db: Session, task_id: int) -> int:
    """タスクの総作業時間を計算（サブタスクの作業時間の合計、分単位）"""
    from app.models.models import Subtask
    
    total_time = db.query(RecordWork).join(Subtask).filter(
        Subtask.task_id == task_id
    ).with_entities(
        func.sum(RecordWork.work_time)
    ).scalar()
    
    return total_time or 0


def get_record_works_by_task(db: Session, task_id: int) -> List[RecordWork]:
    """タスクIDで作業記録一覧を取得（全サブタスク）"""
    from app.models.models import Subtask
    
    return db.query(RecordWork).join(Subtask).filter(
        Subtask.task_id == task_id
    ).order_by(RecordWork.date.desc()).all()


def get_record_works_by_task_and_date_range(db: Session, task_id: int, start_date: date, end_date: date) -> List[RecordWork]:
    """タスクIDと日付範囲で作業記録を取得"""
    from app.models.models import Subtask
    
    return db.query(RecordWork).join(Subtask).filter(
        and_(
            Subtask.task_id == task_id,
            RecordWork.date >= start_date,
            RecordWork.date <= end_date
        )
    ).order_by(RecordWork.date.asc()).all()
