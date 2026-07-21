from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..services.task_service import TaskService


class TaskController:
    def __init__(self, db: Session):
        self.db = db
        self.service = TaskService(db)

    def create_task(self, user_id: int, payload: schemas.TaskCreate):
        return self.service.create_task(user_id, payload)

    def list_tasks(self, user_id: int):
        return self.service.get_all_tasks(user_id)

    def list_deleted_tasks(self, user_id: int):
        return self.service.get_deleted_tasks(user_id)

    def get_task(self, task_id: int, user_id: int):
        task = self.service.get_task(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    def update_task(self, task_id: int, user_id: int, payload: schemas.TaskCreate):
        task = self.service.update_task(task_id, user_id, payload)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    def soft_delete_task(self, task_id: int, user_id: int):
        task = self.service.soft_delete_task(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return {"message": "Task deleted successfully"}

    def restore_task(self, task_id: int, user_id: int):
        task = self.service.restore_task(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    def permanently_delete_task(self, task_id: int, user_id: int):
        task = self.service.permanently_delete_task(task_id, user_id)
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return None
