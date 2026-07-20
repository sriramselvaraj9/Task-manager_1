import { CheckCircle2, Circle, Trash2, Clock, CalendarDays, Flag } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "N/A";

  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const priorityLabel = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "Medium");

function TaskItem({ task, onDelete, onToggleComplete }) {
  const handleDelete = (e) => {
    e.stopPropagation(); // Avoid triggering completion toggle when clicking delete
    onDelete(task.id);
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
          <span className={`status-badge priority ${task.priority || "medium"}`}>
            <Flag size={12} />
            <span>{priorityLabel(task.priority)}</span>
          </span>
          <span className="status-badge date">
            <CalendarDays size={12} />
            <span>Start {formatDate(task.start_date)}</span>
          </span>
          <span className="status-badge date">
            <Clock size={12} />
            <span>Due {formatDate(task.due_date)}</span>
          </span>
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