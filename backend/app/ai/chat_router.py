import re
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..auth import get_current_user
from ..controllers.task_controller import TaskController
from .chat_service import AIService
from .. import schemas, models

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/chat")
async def chat_assistant(
    request: Request,
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ai_service = AIService()
    parsed = await ai_service.prompt_for_intent(payload.get("message", ""))
    response = ai_service.format_response(parsed)
    controller = TaskController(db)
    intent = response.get("intent")
    function_name = response.get("function_name")
    function_args = response.get("function_arguments", {})

    if function_name == "create_task":
        if not function_args.get("due_date"):
            function_args["due_date"] = date.today().isoformat()
        if not function_args.get("title"):
            function_args["title"] = "New Task"
        task_payload = schemas.TaskCreate(**function_args)
        created = controller.create_task(current_user.id, task_payload)
        response["ai_message"] = "Task created successfully."
        response["result"] = created
    elif function_name == "update_task":
        task_id = function_args.pop("task_id", None)
        if task_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="task_id is required")
        task_payload = schemas.TaskCreate(**function_args)
        updated = controller.update_task(task_id, current_user.id, task_payload)
        response["ai_message"] = "Task updated successfully." if updated else "Task not found."
        response["result"] = updated
    elif function_name == "delete_task":
        task_id = function_args.get("task_id")
        deleted = controller.soft_delete_task(task_id, current_user.id)
        response["ai_message"] = "Task moved to Restore." if deleted else "Task not found."
        response["result"] = deleted
    elif function_name == "restore_task":
        task_id = function_args.get("task_id")
        restored = controller.restore_task(task_id, current_user.id)
        response["ai_message"] = "Task restored successfully." if restored else "Task not found."
        response["result"] = restored
    elif function_name == "permanent_delete":
        task_id = function_args.get("task_id")
        deleted = controller.permanently_delete_task(task_id, current_user.id)
        response["ai_message"] = "Task permanently deleted." if deleted else "Task not found."
        response["result"] = deleted
    elif function_name == "complete_task":
        task_id = function_args.get("task_id")
        task = controller.get_task(task_id, current_user.id)
        if task:
            task.completed = True
            db.commit()
            db.refresh(task)
            response["ai_message"] = "Task marked as completed."
            response["result"] = task
        else:
            response["ai_message"] = "Task not found."
    elif function_name == "list_tasks":
        tasks = controller.list_tasks(current_user.id)
        response["result"] = tasks
    elif function_name == "search_tasks":
        keyword = function_args.get("query", "")
        tasks = [task for task in controller.list_tasks(current_user.id) if keyword.lower() in task.title.lower() or keyword.lower() in task.description.lower()]
        response["result"] = tasks
    elif function_name is None and intent == "CREATE_TASK":
        title_text = payload.get("message", "").strip()
        title_text = re.sub(r"^(create|add|make|new)\s+(a\s+)?(task\s+)?", "", title_text, flags=re.IGNORECASE).strip()
        title_text = title_text or "New Task"
        task_args = {
            "title": title_text,
            "description": "",
            "due_date": date.today().isoformat(),
            "priority": "medium",
            "completed": False,
        }
        task_payload = schemas.TaskCreate(**task_args)
        created = controller.create_task(current_user.id, task_payload)
        response["ai_message"] = "Task created successfully."
        response["result"] = created
    else:
        response["ai_message"] = response.get("ai_message") or "I can help with tasks or answer general questions."

    return response
