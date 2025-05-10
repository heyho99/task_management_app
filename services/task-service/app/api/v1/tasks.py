from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.crud import task as crud
from app.schemas import task as schemas
from app.db.session import get_db

# TODO: 認証関連は認証サービスと連携する必要があるため、仮実装
from app.core.deps import get_current_user

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
    tasks = crud.get_tasks(db, user_id=current_user_id, skip=skip, limit=limit)
    return tasks


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
    
    return db_task


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