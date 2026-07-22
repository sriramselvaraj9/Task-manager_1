import TaskItem from "./TaskItem";

function TaskList({ tasks, deleteTask, toggleComplete, onEdit }) {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onDelete={deleteTask}
          onToggleComplete={toggleComplete}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}

export default TaskList;