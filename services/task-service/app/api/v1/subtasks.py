from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.crud import subtask as crud
from app.schemas import task as schemas
from app.db.session import get_db

# TODO: 認証関連は認証サービスと連携する必要があるため、仮実装
from app.core.deps import get_current_user

router = APIRouter(
    prefix="/subtasks",
    tags=["subtasks"],
    responses={404: {"description": "Not found"}},
)


@router.get("/task/{task_id}", response_model=List[schemas.Subtask])
def get_subtasks_by_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたタスクに紐づくサブタスク一覧を取得する
    """
    # TODO: ユーザーの権限確認（仮実装）
    # タスクへのアクセス権限確認
    from app.crud.task import get_task
    task = get_task(db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="タスクが見つかりません")
    if task.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="このタスクへのアクセス権限がありません")
    
    subtasks = crud.get_subtasks(db, task_id=task_id)
    return subtasks


@router.get("/{subtask_id}", response_model=schemas.Subtask)
def get_subtask(
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたIDのサブタスクを取得する
    """
    subtask = crud.get_subtask(db, subtask_id=subtask_id)
    if subtask is None:
        raise HTTPException(status_code=404, detail="サブタスクが見つかりません")
    
    # ユーザーの権限確認（仮実装）
    from app.crud.task import get_task
    task = get_task(db, task_id=subtask.task_id)
    if task.user_id != current_user_id:
        raise HTTPException(status_code=403, detail="このサブタスクへのアクセス権限がありません")
    
    return subtask


@router.post("/task/{task_id}", response_model=schemas.Subtask)
def create_subtask(
    task_id: int,
    subtask: schemas.SubtaskCreate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    新しいサブタスクを作成する
    """
    return crud.create_subtask(db=db, subtask=subtask, task_id=task_id, user_id=current_user_id)


@router.put("/{subtask_id}", response_model=schemas.Subtask)
def update_subtask(
    subtask_id: int,
    subtask: schemas.SubtaskUpdate,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたIDのサブタスクを更新する
    """
    return crud.update_subtask(db=db, subtask_id=subtask_id, subtask=subtask, user_id=current_user_id)


@router.delete("/{subtask_id}", response_model=Dict[str, Any])
def delete_subtask(
    subtask_id: int,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user)
):
    """
    指定されたIDのサブタスクを削除する
    """
    return crud.delete_subtask(db=db, subtask_id=subtask_id, user_id=current_user_id) 