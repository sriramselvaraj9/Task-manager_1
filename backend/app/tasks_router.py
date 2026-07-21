from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from .database import get_db
from . import models, schemas
from .auth import get_current_user
from .controllers.task_controller import TaskController
from .limiter import limiter
from .config import settings

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post("", response_model=schemas.TaskResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def create_task(
    request: Request,
    task: schemas.TaskCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task for the current authenticated user."""
    controller = TaskController(db)
    return controller.create_task(current_user.id, task)


@router.get("", response_model=list[schemas.TaskResponse])
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_tasks(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all active tasks belonging to the current user."""
    controller = TaskController(db)
    return controller.list_tasks(current_user.id)


@router.get("/deleted", response_model=list[schemas.TaskResponse])
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_deleted_tasks(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all soft-deleted tasks belonging to the current user."""
    controller = TaskController(db)
    return controller.list_deleted_tasks(current_user.id)


@router.get("/{task_id}", response_model=schemas.TaskResponse)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a specific task, ensuring it belongs to the current user."""
    controller = TaskController(db)
    return controller.get_task(task_id, current_user.id)


@router.put("/{task_id}", response_model=schemas.TaskResponse)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def update_task(
    request: Request,
    task_id: int,
    task: schemas.TaskCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific task, ensuring it belongs to the current user."""
    controller = TaskController(db)
    return controller.update_task(task_id, current_user.id, task)


@router.delete("/{task_id}")
@limiter.limit(settings.RATE_LIMIT_TASKS)
def delete_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Soft-delete a specific task, ensuring it belongs to the current user."""
    controller = TaskController(db)
    return controller.soft_delete_task(task_id, current_user.id)


@router.put("/{task_id}/restore", response_model=schemas.TaskResponse)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def restore_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a soft-deleted task, ensuring it belongs to the current user."""
    controller = TaskController(db)
    return controller.restore_task(task_id, current_user.id)


@router.delete("/{task_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def permanently_delete_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a previously soft-deleted task."""
    controller = TaskController(db)
    return controller.permanently_delete_task(task_id, current_user.id)