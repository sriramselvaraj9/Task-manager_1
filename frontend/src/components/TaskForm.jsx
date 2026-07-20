import { useState } from "react";
import {
  PlusCircle,
  Heading,
  AlignLeft,
  AlertCircle,
  CalendarDays,
  Flag,
} from "lucide-react";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

function TaskForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
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

    if (!trimmedDescription) {
      setError("Task description is required.");
      return;
    }

    if (!dueDate) {
      setError("Task due date is required.");
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
      start_date: startDate,
      due_date: dueDate,
      priority,
      completed: false,
    });

    setTitle("");
    setDescription("");
    setStartDate(getTodayDate());
    setDueDate("");
    setPriority("medium");
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error-text" role="alert" aria-live="assertive">
          <AlertCircle className="form-error-icon" size={18} />
          {error}
        </div>
      )}

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
            required
          />
          <span className={`char-counter ${description.length > 500 ? "excess" : ""}`}>
            {description.length}/500
          </span>
        </div>
      </div>

      <div className="task-form-grid">
        <div className="input-group">
          <label htmlFor="task-start-date">Start Date</label>
          <div className="input-wrapper">
            <CalendarDays className="input-icon" size={18} />
            <input
              id="task-start-date"
              type="date"
              value={startDate}
              disabled
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="task-due-date">Due Date</label>
          <div className="input-wrapper">
            <CalendarDays className="input-icon" size={18} />
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => {
                setDueDate(e.target.value);
                if (error) setError("");
              }}
              required
            />
          </div>
        </div>

        <div className="input-group task-form-grid-full">
          <label htmlFor="task-priority">Priority</label>
          <div className="priority-selector" role="radiogroup" aria-label="Priority">
            <button
              type="button"
              className={`priority-chip low ${priority === "low" ? "active" : ""}`}
              onClick={() => {
                setPriority("low");
                if (error) setError("");
              }}
              aria-pressed={priority === "low"}
            >
              <Flag size={14} />
              <span>Low</span>
            </button>
            <button
              type="button"
              className={`priority-chip medium ${priority === "medium" ? "active" : ""}`}
              onClick={() => {
                setPriority("medium");
                if (error) setError("");
              }}
              aria-pressed={priority === "medium"}
            >
              <Flag size={14} />
              <span>Medium</span>
            </button>
            <button
              type="button"
              className={`priority-chip high ${priority === "high" ? "active" : ""}`}
              onClick={() => {
                setPriority("high");
                if (error) setError("");
              }}
              aria-pressed={priority === "high"}
            >
              <Flag size={14} />
              <span>High</span>
            </button>
          </div>
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