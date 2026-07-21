from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from datetime import date

from .database import get_db
from . import models, schemas
from .auth import get_current_user
from .limiter import limiter
from .config import settings
from . import crud

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
    db_task = models.Task(
        title=task.title,
        description=task.description,
        start_date=task.start_date or date.today(),
        due_date=task.due_date,
        priority=task.priority,
        completed=task.completed,
        user_id=current_user.id,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("", response_model=list[schemas.TaskResponse])
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_tasks(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all tasks belonging to the current user."""
    return crud.get_tasks(db, current_user.id)


@router.get("/deleted", response_model=list[schemas.TaskResponse])
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_deleted_tasks(
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve all soft-deleted tasks belonging to the current user.--------------------------------------------""""
    return crud.get_deleted_tasks(db, current_user.id)


@router.get("/{task_id}", response_model=schemas.TaskResponse)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a specific task, ensuring it belongs to the current user."""
    db_task = crud.get_task(db, task_id, current_user.id)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return db_task


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
    db_task = crud.get_task(db, task_id, current_user.id)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    return crud.update_task(db, task_id, current_user.id, task)


@router.delete("/{task_id}")
@limiter.limit(settings.RATE_LIMIT_TASKS)
def delete_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific task, ensuring it belongs to the current user."""
    db_task = crud.soft_delete_task(db, task_id, current_user.id)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    return {"message": "Task deleted successfully"}


@router.put("/{task_id}/restore", response_model=schemas.TaskResponse)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def restore_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Restore a soft-deleted task, ensuring it belongs to the current user."""
    db_task = crud.restore_task(db, task_id, current_user.id)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    if not db_task.is_deleted:
        return db_task
    return db_task


@router.delete("/{task_id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def permanently_delete_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Permanently delete a previously soft-deleted task."""
    db_task = crud.permanently_delete_task(db, task_id, current_user.id)
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )