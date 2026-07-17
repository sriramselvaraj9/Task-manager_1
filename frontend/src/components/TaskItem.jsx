function TaskItem({ task, onDelete, onToggleComplete }) {
  const handleDelete = () => {
    const confirmDelete = window.confirm(
      `Delete "${task.title}"? This cannot be undone.`
    );

    if (confirmDelete) {
      onDelete(task.id);
    }
  };

  const handleToggleComplete = () => {
    onToggleComplete(task);
  };

  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <div className="task-content">
        <h3>{task.title}</h3>
        <p>{task.description}</p>

        <span className="task-status">
          {task.completed ? "Completed" : "Pending"}
        </span>
      </div>

      <div className="task-actions">
        <button type="button" className="task-button secondary" onClick={handleToggleComplete}>
          {task.completed ? "Mark Pending" : "Mark Complete"}
        </button>
        <button type="button" className="task-button danger" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

export default TaskItem;