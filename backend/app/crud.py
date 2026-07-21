from sqlalchemy.orm import Session
from datetime import date
from sqlalchemy import case
from . import models, schemas


def _task_priority_rank():
    return case(
        (models.Task.priority == "high", 0),
        (models.Task.priority == "medium", 1),
        else_=2,
    )


def create_task(db: Session, task: schemas.TaskCreate):
    db_task = models.Task(
        title=task.title,
        description=task.description,
        start_date=task.start_date or date.today(),
        due_date=task.due_date,
        priority=task.priority,
        completed=task.completed,
    )

    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    return db_task


def get_tasks(db: Session, user_id: int):
    return (
        db.query(models.Task)
        .filter(models.Task.user_id == user_id, models.Task.is_deleted == False)
        .order_by(models.Task.due_date.asc(), _task_priority_rank().asc(), models.Task.id.asc())
        .all()
    )


def get_deleted_tasks(db: Session, user_id: int):
    return (
        db.query(models.Task)
        .filter(models.Task.user_id == user_id, models.Task.is_deleted == True)
        .order_by(models.Task.deleted_at.desc().nullslast(), models.Task.id.desc())
        .all()
    )


def get_task(db: Session, task_id: int, user_id: int, include_deleted: bool = False):
    query = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == user_id,
    )
    if not include_deleted:
        query = query.filter(models.Task.is_deleted == False)
    return query.first()


def update_task(db: Session, task_id: int, user_id: int, task: schemas.TaskCreate):
    db_task = get_task(db, task_id, user_id)

    if db_task:
        db_task.title = task.title
        db_task.description = task.description
        db_task.start_date = task.start_date or db_task.start_date
        db_task.due_date = task.due_date
        db_task.priority = task.priority
        db_task.completed = task.completed

        db.commit()
        db.refresh(db_task)

    return db_task


def soft_delete_task(db: Session, task_id: int, user_id: int):
    db_task = get_task(db, task_id, user_id)

    if db_task:
        from datetime import datetime, timezone

        db_task.is_deleted = True
        db_task.deleted_at = datetime.now(timezone.utc)
        db.commit()

    return db_task


def restore_task(db: Session, task_id: int, user_id: int):
    db_task = get_task(db, task_id, user_id, include_deleted=True)

    if not db_task or not db_task.is_deleted:
        return None

    db_task.is_deleted = False
    db_task.deleted_at = None
    db.commit()
    db.refresh(db_task)

    return db_task


def permanently_delete_task(db: Session, task_id: int, user_id: int):
    db_task = get_task(db, task_id, user_id, include_deleted=True)

    if db_task and db_task.is_deleted:
        db.delete(db_task)
        db.commit()

    return db_task