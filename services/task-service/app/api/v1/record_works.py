from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db, get_current_user
from app.crud import record_work as crud_record_work
from app.crud import subtask as crud_subtask
from app.schemas.task import RecordWork, RecordWorkCreate, RecordWorkUpdate

router = APIRouter()


@router.get("/subtasks/{subtask_id}/record-works", response_model=List[RecordWork])
def get_record_works(
    subtask_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """サブタスクの作業記録一覧を取得"""
    # サブタスクの存在確認
    subtask = crud_subtask.get_subtask(db, subtask_id=subtask_id)
    if not subtask:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="サブタスクが見つかりません"
        )
    
    return crud_record_work.get_record_works_by_subtask(db, subtask_id=subtask_id)


@router.post("/subtasks/{subtask_id}/record-works", response_model=RecordWork)
def create_record_work(
    subtask_id: int,
    record_work: RecordWorkCreate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """作業記録を作成"""
    # サブタスクの存在確認
    subtask = crud_subtask.get_subtask(db, subtask_id=subtask_id)
    if not subtask:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="サブタスクが見つかりません"
        )
    
    try:
        return crud_record_work.create_record_work(db, record_work=record_work, subtask_id=subtask_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/record-works/{record_work_id}", response_model=RecordWork)
def get_record_work(
    record_work_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """作業記録を取得"""
    record_work = crud_record_work.get_record_work(db, record_work_id=record_work_id)
    if not record_work:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="作業記録が見つかりません"
        )
    return record_work


@router.put("/record-works/{record_work_id}", response_model=RecordWork)
def update_record_work(
    record_work_id: int,
    record_work_update: RecordWorkUpdate,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """作業記録を更新"""
    try:
        record_work = crud_record_work.update_record_work(db, record_work_id=record_work_id, record_work_update=record_work_update)
        if not record_work:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="作業記録が見つかりません"
            )
        return record_work
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/record-works/{record_work_id}")
def delete_record_work(
    record_work_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """作業記録を削除"""
    success = crud_record_work.delete_record_work(db, record_work_id=record_work_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="作業記録が見つかりません"
        )
    return {"message": "作業記録を削除しました"}


@router.get("/subtasks/{subtask_id}/progress")
def get_subtask_progress(
    subtask_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """サブタスクの進捗率を取得"""
    # サブタスクの存在確認
    subtask = crud_subtask.get_subtask(db, subtask_id=subtask_id)
    if not subtask:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="サブタスクが見つかりません"
        )
    
    progress = crud_record_work.get_subtask_progress(db, subtask_id=subtask_id)
    return {"subtask_id": subtask_id, "progress": progress}


@router.get("/subtasks/{subtask_id}/summary")
def get_subtask_work_summary(
    subtask_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """サブタスクの作業実績集計を取得"""
    # サブタスクの存在確認
    subtask = crud_subtask.get_subtask(db, subtask_id=subtask_id)
    if not subtask:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="サブタスクが見つかりません"
        )
    
    summary = crud_record_work.get_subtask_work_summary(db, subtask_id=subtask_id)
    return {
        "subtask_id": subtask_id,
        "total_work": summary["total_work"],
        "total_work_time": summary["total_work_time"],
        "work_days": summary["work_days"]
    }


@router.get("/tasks/{task_id}/work-summary")
def get_task_work_summary(
    task_id: int,
    current_user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """タスクの作業実績集計を取得"""
    from app.crud import task as crud_task
    
    # タスクの存在確認
    task = crud_task.get_task(db, task_id=task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="タスクが見つかりません"
        )
    
    summary = crud_record_work.get_task_work_summary(db, task_id=task_id)
    return {
        "task_id": task_id,
        "total_work": summary["total_work"],
        "total_work_time": summary["total_work_time"],
        "total_work_records": summary["total_work_records"]
    }
