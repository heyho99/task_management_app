from typing import List, Optional
from datetime import date
from pydantic import BaseModel, Field, validator
from typing import Dict, Any


class BaseSchemaModel(BaseModel):
    class Config:
        orm_mode = True


# サブタスクスキーマ
class SubtaskBase(BaseSchemaModel):
    subtask_name: str = Field(..., description="サブタスク名") # 型=Field()で、さらに厳密にできる
    contribution_value: int = Field(..., description="作業貢献値（0-100）", ge=0, le=100)


class SubtaskCreate(SubtaskBase):
    pass


class SubtaskUpdate(SubtaskBase):
    subtask_name: Optional[str] = None # Optional[]型は、入力は必須ではないことを表す
    contribution_value: Optional[int] = None


class Subtask(SubtaskBase):
    subtask_id: int
    task_id: int
    progress: int = 0  # 進捗率（フロントエンド表示用）


# 日次タスク計画スキーマ
class DailyTaskPlanBase(BaseSchemaModel):
    date: date
    task_plan_value: float = Field(..., description="作業計画値（0-100）", ge=0, le=100)


class DailyTaskPlanCreate(DailyTaskPlanBase):
    pass


class DailyTaskPlanUpdate(DailyTaskPlanBase):
    task_plan_value: Optional[float] = None


class DailyTaskPlan(DailyTaskPlanBase):
    daily_task_plan_id: int
    task_id: int


# 日次時間計画スキーマ
class DailyTimePlanBase(BaseSchemaModel):
    date: date
    time_plan_value: float = Field(..., description="作業時間計画値（分）", ge=0)


class DailyTimePlanCreate(DailyTimePlanBase):
    pass


class DailyTimePlanUpdate(DailyTimePlanBase):
    time_plan_value: Optional[float] = None


class DailyTimePlan(DailyTimePlanBase):
    daily_time_plan_id: int
    task_id: int


# 作業記録スキーマ（作業量と時間を統合）
class RecordWorkBase(BaseSchemaModel):
    date: date
    work: int = Field(..., description="作業量（0-100）", ge=0, le=100)
    work_time: int = Field(0, description="作業時間（分）", ge=0)


class RecordWorkCreate(RecordWorkBase):
    pass


class RecordWorkUpdate(RecordWorkBase):
    date: Optional[date] = None
    work: Optional[int] = None
    work_time: Optional[int] = None


class RecordWork(RecordWorkBase):
    record_work_id: int
    subtask_id: int


# 日次時間計画スキーマ
class DailyTimePlanBase(BaseSchemaModel):
    date: date
    time_plan_value: float = Field(..., description="作業時間計画値（分単位）", ge=0)


class DailyTimePlanCreate(DailyTimePlanBase):
    pass


class DailyTimePlanUpdate(DailyTimePlanBase):
    time_plan_value: Optional[float] = None


class DailyTimePlan(DailyTimePlanBase):
    daily_time_plan_id: int
    task_id: int


# タスクスキーマ
class TaskBase(BaseSchemaModel):
    task_name: str = Field(..., description="タスク名")
    task_content: Optional[str] = Field(None, description="タスク内容")
    recent_schedule: Optional[str] = Field(None, description="直近の予定")
    start_date: date = Field(..., description="開始予定日")
    due_date: date = Field(..., description="完了予定日") # 下記の@validatorでさらに厳密な値条件を指定
    category: Optional[str] = Field(None, description="カテゴリー")
    target_time: Optional[int] = Field(None, description="目標作業時間（分単位）", ge=0)
    comment: Optional[str] = Field(None, description="コメント")

    @validator('due_date')
    def due_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('完了予定日は開始予定日より後でなければなりません')
        return v


class TaskCreate(TaskBase):
    subtasks: List[SubtaskCreate] = []
    daily_task_plans: List[DailyTaskPlanCreate] = []
    daily_time_plans: List[DailyTimePlanCreate] = []


class TaskUpdate(TaskBase):
    task_name: Optional[str] = None
    task_content: Optional[str] = None
    recent_schedule: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    category: Optional[str] = None
    target_time: Optional[int] = None
    comment: Optional[str] = None
    daily_task_plans: Optional[List[DailyTaskPlanCreate]] = None
    daily_time_plans: Optional[List[DailyTimePlanCreate]] = None


class Task(TaskBase):
    task_id: int
    user_id: int
    subtasks: List[Subtask] = []
    daily_task_plans: List[DailyTaskPlan] = []
    daily_time_plans: List[DailyTimePlan] = []
    progress: int = 0  # 進捗率（フロントエンド表示用）


# タスク初期値計算用スキーマ
class TaskInitialValues(BaseModel):
    start_date: date
    due_date: date
    target_time: int
    subtask_count: int = Field(..., ge=1)

    @validator('due_date')
    def due_date_must_be_after_start_date(cls, v, values):
        if 'start_date' in values and v < values['start_date']:
            raise ValueError('完了予定日は開始予定日より後でなければなりません')
        return v 