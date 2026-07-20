from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy import case
from sqlalchemy.orm import Session
from datetime import date, datetime, timezone

from .database import get_db
from . import models, schemas
from .auth import get_current_user
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
    db_task = models.Task(
        title=task.title,
        description=task.description,
        start_date=task.start_date or date.today(),
        due_date=task.due_date,
        priority=task.priority,
        completed=task.completed,
        user_id=current_user.id
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
    priority_rank = case(
        (models.Task.priority == "high", 0),
        (models.Task.priority == "medium", 1),
        else_=2,
    )

    return (
        db.query(models.Task)
        .filter(models.Task.user_id == current_user.id, models.Task.is_deleted == False)
        .order_by(models.Task.due_date.asc(), priority_rank.asc(), models.Task.id.asc())
        .all()
    )


@router.get("/{task_id}", response_model=schemas.TaskResponse)
@limiter.limit(settings.RATE_LIMIT_TASKS)
def read_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve a specific task, ensuring it belongs to the current user."""
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
        models.Task.is_deleted == False
    ).first()
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
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
        models.Task.is_deleted == False
    ).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db_task.title = task.title
    db_task.description = task.description
    db_task.start_date = task.start_date or db_task.start_date
    db_task.due_date = task.due_date
    db_task.priority = task.priority
    db_task.completed = task.completed
    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}")
@limiter.limit(settings.RATE_LIMIT_TASKS)
def delete_task(
    request: Request,
    task_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific task, ensuring it belongs to the current user."""
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id,
        models.Task.is_deleted == False
    ).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db_task.is_deleted = True
    db_task.deleted_at = datetime.now(timezone.utc)
    db.commit()
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
    db_task = db.query(models.Task).filter(
        models.Task.id == task_id,
        models.Task.user_id == current_user.id
    ).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    if not db_task.is_deleted:
        return db_task
        
    db_task.is_deleted = False
    db_task.deleted_at = None
    db.commit()
    db.refresh(db_task)
    return db_task