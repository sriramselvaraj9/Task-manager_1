function TaskItem({ task }) {
  return (
    <div
      style={{
        border: "1px solid gray",
        padding: "10px",
        marginTop: "10px",
      }}
    >
      <h3>{task.title}</h3>
      <p>{task.description}</p>

      <strong>
        {task.completed ? "Completed ✅" : "Pending ⏳"}
      </strong>
    </div>
  );
}

export default TaskItem;