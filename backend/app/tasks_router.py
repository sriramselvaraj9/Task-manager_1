from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

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
    return db.query(models.Task).filter(models.Task.user_id == current_user.id).all()


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
        models.Task.user_id == current_user.id
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
        models.Task.user_id == current_user.id
    ).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db_task.title = task.title
    db_task.description = task.description
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
        models.Task.user_id == current_user.id
    ).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}
