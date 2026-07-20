from sqlalchemy.orm import Session
from datetime import date
from . import models, schemas


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


def get_tasks(db: Session):
    return db.query(models.Task).all()


def get_task(db: Session, task_id: int):
    return db.query(models.Task).filter(models.Task.id == task_id).first()


def update_task(db: Session, task_id: int, task: schemas.TaskCreate):
    db_task = get_task(db, task_id)

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


def delete_task(db: Session, task_id: int):
    db_task = get_task(db, task_id)

    if db_task:
        db.delete(db_task)
        db.commit()

    return db_task