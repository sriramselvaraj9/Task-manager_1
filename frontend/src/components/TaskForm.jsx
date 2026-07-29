import { useState, useRef, useCallback, useEffect } from "react";
import {
  PlusCircle,
  Heading,
  AlignLeft,
  AlertCircle,
  CalendarDays,
  Flag,
  Sparkles,
} from "lucide-react";
import API from "../services/api";

const getTodayDate = () => new Date().toISOString().slice(0, 10);

// Reusable AI improve button with spinner + tooltip
function AIImproveButton({ onClick, loading, tooltip, id }) {
  return (
    <button
      id={id}
      type="button"
      className={`ai-improve-btn ${loading ? "ai-improve-btn--loading" : ""}`}
      onClick={onClick}
      disabled={loading}
      title={tooltip}
      aria-label={tooltip}
    >
      {loading ? (
        <span className="ai-spinner" aria-hidden="true" />
      ) : (
        <Sparkles size={15} />
      )}
      <span className="ai-improve-tooltip">{tooltip}</span>
    </button>
  );
}

function TaskForm({ onAdd, onToast, editTask = null, initialData = null, onUpdate, onCancelEdit }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [error, setError] = useState("");

  const [aiTitleLoading, setAiTitleLoading] = useState(false);
  const [aiDescLoading, setAiDescLoading] = useState(false);

  const startDateRef = useRef(null);
  const dueDateRef = useRef(null);

  const openPicker = (ref) => {
    if (ref.current) {
      try {
        ref.current.showPicker();
      } catch {
        ref.current.focus();
      }
    }
  };


  const improveText = useCallback(async (text, field, setter, setLoading) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setLoading(true);
    try{
      const res = await API.post("/ai/improve-text", { text: trimmed, field });
      setter(res.data.improved_text);
      onToast?.("✨ Text improved successfully.");
    } catch (err) {
      console.error("AI improve error:", err?.response?.data || err?.message || err);
      const detail = err?.response?.data?.detail;
      const msg = detail
        ? `AI error: ${detail}`
        : "Unable to improve the text. Please try again.";
      onToast?.(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [onToast]);

  const handleSubmit = async (e) => {
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

    if (new Date(dueDate) < new Date(startDate)) {
      setError("Due Date cannot be earlier than the Start Date.");
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

    const payload = {
      title: trimmedTitle,
      description: trimmedDescription,
      start_date: startDate,
      due_date: dueDate,
      priority,
      completed: false,
    };

    let success = false;
    if (editTask && onUpdate) {
      success = await onUpdate(editTask.id, payload);
      if (success) onCancelEdit?.();
    } else {
      success = await onAdd(payload);
    }

    if (success) {
      // Reset form to blank for create mode
      setTitle("");
      setDescription("");
      setStartDate(getTodayDate());
      setDueDate("");
      setPriority("medium");
    }
  };

  // Populate form when editTask or initialData changes
  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title || "");
      setDescription(editTask.description || "");
      setStartDate(editTask.start_date || getTodayDate());
      setDueDate(editTask.due_date || getTodayDate());
      setPriority(editTask.priority || "medium");
    } else if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setStartDate(initialData.start_date || getTodayDate());
      setDueDate(initialData.due_date || getTodayDate());
      setPriority(initialData.priority || "medium");
    }
  }, [editTask, initialData]);

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && (
        <div className="form-error-text" role="alert" aria-live="assertive">
          <AlertCircle className="form-error-icon" size={18} />
          {error}
        </div>
      )}

      {/* ── Title ─────────────────────────────────────────────── */}
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
          <AIImproveButton
            id="ai-improve-title-btn"
            tooltip="Improve Title with AI"
            loading={aiTitleLoading}
            onClick={() =>
              improveText(title, "title", setTitle, setAiTitleLoading)
            }
          />
          
        </div>
      </div>

      {/* ── Description ───────────────────────────────────────── */}
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
          <AIImproveButton
            id="ai-improve-desc-btn"
            tooltip="Improve Description with AI"
            loading={aiDescLoading}
            onClick={() =>
              improveText(
                description,
                "description",
                setDescription,
                setAiDescLoading
              )
            }
          /> 

        </div>
      </div>

      {/* ── Dates + Priority ──────────────────────────────────── */}
      <div className="task-form-grid">
        <div className="input-group">
          <label htmlFor="task-start-date">Start Date</label>
          <div className="input-wrapper date-wrapper">
            <button
              type="button"
              className="date-icon-btn"
              aria-label="Open start date picker"
              onClick={() => openPicker(startDateRef)}
            >
              <CalendarDays size={18} />
            </button>
            <input
              ref={startDateRef}
              id="task-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (error) setError("");
              }}
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="task-due-date">Due Date</label>
          <div className="input-wrapper date-wrapper">
            <button
              type="button"
              className="date-icon-btn"
              aria-label="Open due date picker"
              onClick={() => openPicker(dueDateRef)}
            >
              <CalendarDays size={18} />
            </button>
            <input
              ref={dueDateRef}
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
              onClick={() => { setPriority("low"); if (error) setError(""); }}
              aria-pressed={priority === "low"}
            >
              <Flag size={14} />
              <span>Low</span>
            </button>
            <button
              type="button"
              className={`priority-chip medium ${priority === "medium" ? "active" : ""}`}
              onClick={() => { setPriority("medium"); if (error) setError(""); }}
              aria-pressed={priority === "medium"}
            >
              <Flag size={14} />
              <span>Medium</span>
            </button>
            <button
              type="button"
              className={`priority-chip high ${priority === "high" ? "active" : ""}`}
              onClick={() => { setPriority("high"); if (error) setError(""); }}
              aria-pressed={priority === "high"}
            >
              <Flag size={14} />
              <span>High</span>
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn-primary form-submit-btn">
          <PlusCircle size={18} />
          <span>{editTask ? 'Save Changes' : 'Add Task'}</span>
        </button>
        {editTask && (
          <button type="button" className="btn-secondary" onClick={() => onCancelEdit?.()}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default TaskForm;