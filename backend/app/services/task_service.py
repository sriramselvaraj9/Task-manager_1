from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from .. import models, schemas


class TaskService:
    def __init__(self, db: Session):
        self.db = db

    def create_task(self, user_id: int, payload: schemas.TaskCreate) -> models.Task:
        task = models.Task(
            title=payload.title,
            description=payload.description,
            start_date=payload.start_date or date.today(),
            due_date=payload.due_date,
            priority=payload.priority,
            completed=payload.completed,
            user_id=user_id,
        )
        self.db.add(task)
        self.db.commit()
        self.db.refresh(task)
        return task

    def get_all_tasks(self, user_id: int):
        return (
            self.db.query(models.Task)
            .filter(models.Task.user_id == user_id, models.Task.is_deleted == False)
            .order_by(models.Task.due_date.asc(), models.Task.id.asc())
            .all()
        )

    def get_deleted_tasks(self, user_id: int):
        return (
            self.db.query(models.Task)
            .filter(models.Task.user_id == user_id, models.Task.is_deleted == True)
            .order_by(models.Task.deleted_at.desc().nullslast(), models.Task.id.desc())
            .all()
        )

    def get_task(self, task_id: int, user_id: int, include_deleted: bool = False):
        query = self.db.query(models.Task).filter(
            models.Task.id == task_id,
            models.Task.user_id == user_id,
        )
        if not include_deleted:
            query = query.filter(models.Task.is_deleted == False)
        return query.first()

    def update_task(self, task_id: int, user_id: int, payload: schemas.TaskCreate):
        task = self.get_task(task_id, user_id)
        if not task:
            return None

        task.title = payload.title
        task.description = payload.description
        task.start_date = payload.start_date or task.start_date
        task.due_date = payload.due_date
        task.priority = payload.priority
        task.completed = payload.completed

        self.db.commit()
        self.db.refresh(task)
        return task

    def soft_delete_task(self, task_id: int, user_id: int):
        task = self.get_task(task_id, user_id)
        if not task:
            return None

        task.is_deleted = True
        task.deleted_at = datetime.now(timezone.utc)
        self.db.commit()
        self.db.refresh(task)
        return task

    def restore_task(self, task_id: int, user_id: int):
        task = self.get_task(task_id, user_id, include_deleted=True)
        if not task or not task.is_deleted:
            return None

        task.is_deleted = False
        task.deleted_at = None
        self.db.commit()
        self.db.refresh(task)
        return task

    def permanently_delete_task(self, task_id: int, user_id: int):
        task = self.get_task(task_id, user_id, include_deleted=True)
        if not task or not task.is_deleted:
            return None

        self.db.delete(task)
        self.db.commit()
        return task
