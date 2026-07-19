import { useState } from "react";
import { PlusCircle, Heading, AlignLeft } from "lucide-react";

function TaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      setError("Task title is required.");
      return;
    }

    if (trimmedTitle.length > 100) {
      setError("Title cannot exceed 100 characters.");
      return;
    }

    if (trimmedDescription.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    onAdd({
      title: trimmedTitle,
      description: trimmedDescription,
      completed: false,
    });

    setTitle("");
    setDescription("");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && <div className="form-error-text">{error}</div>}

      <div className="input-group">
        <label htmlFor="task-title">Title</label>
        <div className="input-wrapper">
          <Heading className="input-icon" size={18} />
          <input
            id="task-title"
            type="text"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError("");
            }}
            maxLength={105}
            required
          />
          <span className={`char-counter ${title.length > 100 ? "excess" : ""}`}>
            {title.length}/100
          </span>
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="task-desc">Description</label>
        <div className="input-wrapper">
          <AlignLeft className="input-icon area-icon" size={18} />
          <textarea
            id="task-desc"
            placeholder="Add details or notes..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError("");
            }}
            maxLength={505}
          />
          <span className={`char-counter ${description.length > 500 ? "excess" : ""}`}>
            {description.length}/500
          </span>
        </div>
      </div>

      <button type="submit" className="btn-primary form-submit-btn">
        <PlusCircle size={18} />
        <span>Add Task</span>
      </button>
    </form>
  );
}

export default TaskForm;