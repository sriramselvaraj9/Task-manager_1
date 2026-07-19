import { CheckCircle2, Circle, Trash2, Clock } from "lucide-react";

function TaskItem({ task, onDelete, onToggleComplete }) {
  const handleDelete = (e) => {
    e.stopPropagation(); // Avoid triggering completion toggle when clicking delete
    const confirmDelete = window.confirm(
      `Delete "${task.title}"? This cannot be undone.`
    );

    if (confirmDelete) {
      onDelete(task.id);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    onToggleComplete(task);
  };

  return (
    <div 
      className={`task-item-card ${task.completed ? "completed" : ""}`}
      onClick={handleToggle}
    >
      <div className="task-item-checkbox">
        <button 
          type="button" 
          className="checkbox-button" 
          aria-label={task.completed ? "Mark pending" : "Mark completed"}
        >
          {task.completed ? (
            <CheckCircle2 className="checkbox-icon checked" size={22} />
          ) : (
            <Circle className="checkbox-icon" size={22} />
          )}
        </button>
      </div>

      <div className="task-item-body">
        <h3 className={`task-item-title ${task.completed ? "line-through" : ""}`}>
          {task.title}
        </h3>
        {task.description && (
          <p className="task-item-desc">{task.description}</p>
        )}
        <div className="task-item-meta">
          <span className={`status-badge ${task.completed ? "completed" : "pending"}`}>
            {task.completed ? (
              <>
                <CheckCircle2 size={12} />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Clock size={12} />
                <span>Pending</span>
              </>
            )}
          </span>
        </div>
      </div>

      <div className="task-item-actions">
        <button 
          type="button" 
          className="btn-icon danger" 
          onClick={handleDelete}
          title="Delete Task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}

export default TaskItem;