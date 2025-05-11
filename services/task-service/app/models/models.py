from sqlalchemy import Column, Integer, String, Text, Date, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.db.session import Base

class Task(Base):
    __tablename__ = "tasks"

    task_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, index=True)  # 外部キー (認証サービスへの参照)
    task_name = Column(String, index=True)
    task_content = Column(Text)
    recent_schedule = Column(Text)
    start_date = Column(Date)
    due_date = Column(Date)
    category = Column(String)
    target_time = Column(Integer)  # 分単位で保存
    comment = Column(Text)

    # リレーションシップ
    subtasks = relationship("Subtask", back_populates="task", cascade="all, delete-orphan")
    daily_task_plans = relationship("DailyTaskPlan", back_populates="task", cascade="all, delete-orphan")
    daily_time_plans = relationship("DailyTimePlan", back_populates="task", cascade="all, delete-orphan")


class Subtask(Base):
    __tablename__ = "subtasks"

    subtask_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    subtask_name = Column(String)
    contribution_value = Column(Integer)  # 0-100の値

    # リレーションシップ
    task = relationship("Task", back_populates="subtasks")
    record_works = relationship("RecordWork", back_populates="subtask", cascade="all, delete-orphan")


class DailyTaskPlan(Base):
    __tablename__ = "daily_task_plans"

    daily_task_plan_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    date = Column(Date)
    task_plan_value = Column(Float)  # 0-100の値 (小数点対応)

    # リレーションシップ
    task = relationship("Task", back_populates="daily_task_plans")


class DailyTimePlan(Base):
    __tablename__ = "daily_time_plans"

    daily_time_plan_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.task_id"))
    date = Column(Date)
    time_plan_value = Column(Float)  # 分単位で保存 (小数点対応)

    # リレーションシップ
    task = relationship("Task", back_populates="daily_time_plans")


class RecordWork(Base):
    __tablename__ = "record_works"

    record_work_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subtask_id = Column(Integer, ForeignKey("subtasks.subtask_id"))
    date = Column(Date)
    work = Column(Integer)  # 0-100の値

    # リレーションシップ
    subtask = relationship("Subtask", back_populates="record_works") 