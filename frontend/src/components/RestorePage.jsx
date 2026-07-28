import { useEffect, useState } from "react";
import API from "../services/api";
import TaskSidebar from "./TaskSidebar";
import ConfirmationModal from "./ConfirmationModal";
import Toast from "./Toast";
import { AlertCircle, CalendarDays, Clock, RotateCcw, Trash2, Menu, Moon, Sparkles, Sun } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "N/A";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

function RestorePage({ user, onLogout, theme, toggleTheme }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [modal, setModal] = useState({ open: false, type: null, task: null, loading: false, error: "" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchDeletedTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/tasks/deleted");
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching deleted tasks:", err);
      setError("Failed to load deleted tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeletedTasks();
  }, []);

  const openModal = (type, task) => {
    setModal({ open: true, type, task, loading: false, error: "" });
  };

  const closeModal = () => {
    if (modal.loading) return;
    setModal({ open: false, type: null, task: null, loading: false, error: "" });
  };

  const completeAction = async () => {
    if (!modal.task) return;

    setModal((current) => ({ ...current, loading: true, error: "" }));

    try {
      if (modal.type === "restore") {
        await API.put(`/tasks/${modal.task.id}/restore`);
        setTasks((prev) => prev.filter((task) => task.id !== modal.task.id));
        setToast({ visible: true, message: "Task restored successfully." });
      } else if (modal.type === "permanent") {
        await API.delete(`/tasks/${modal.task.id}/permanent`);
        setTasks((prev) => prev.filter((task) => task.id !== modal.task.id));
        setToast({ visible: true, message: "Task permanently deleted." });
      }
      closeModal();
    } catch (err) {
      console.error("Restore page action failed:", err);
      const errMsg = err.response?.data?.detail || "Action failed. Please try again.";
      setModal((current) => ({ ...current, loading: false, error: Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg }));
    }
  };

  return (
    <div className="dashboard-container">
      <TaskSidebar
        mode="restore"
        userEmail={user?.email}
        onLogout={onLogout}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main-content">
        {/* Mobile top header */}
        <header className="mobile-top-header">
          <div className="mobile-logo-wrapper">
            <Sparkles className="logo-icon" />
            <span className="mobile-brand-name">TaskFlow</span>
          </div>
          <div className="mobile-header-actions">
            <button type="button" className="mobile-action-btn theme-toggle" onClick={toggleTheme} title="Toggle Theme" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="mobile-user-avatar" title={user?.email || "User"}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <button
              type="button"
              className="mobile-action-btn menu-toggle"
              onClick={() => setSidebarOpen(true)}
              title="Open Menu"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          </div>
        </header>

        <header className="top-navbar restore-navbar">
          <div>
            <p className="page-eyebrow">Recovery queue</p>
            <h2 className="restore-title">Restore Deleted Tasks</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="restore-meta">
              <span>{tasks.length} deleted task{tasks.length === 1 ? "" : "s"}</span>
            </div>
          </div>
        </header>

        <main className="page-content restore-page-content">
          <div className="main-feed full-width-feed">
            <div className="glass-panel list-panel">
              <div className="list-header restore-list-header">
                <h2>Deleted Tasks</h2>
                <p>Review tasks before restoring or deleting them permanently.</p>
              </div>

              {error ? (
                <div className="alert error margin-bottom">
                  <AlertCircle className="alert-icon" />
                  <span>{error}</span>
                </div>
              ) : null}

              {loading ? (
                <div className="loading-state">
                  <span className="spinner large"></span>
                  <p>Loading deleted tasks...</p>
                </div>
              ) : tasks.length > 0 ? (
                <div className="restore-list">
                  {tasks.map((task) => (
                    <article key={task.id} className="restore-card">
                      <div className="restore-card-main">
                        <div className="restore-card-title-row">
                          <h3>{task.title}</h3>
                          <span className={`status-badge ${task.completed ? "completed" : "pending"}`}>
                            <Clock size={12} />
                            <span>{task.completed ? "Completed" : "Pending"}</span>
                          </span>
                        </div>
                        <p className="restore-card-description">{task.description || "No description provided."}</p>
                        <div className="restore-card-meta">
                          <span className="restore-meta-item">
                            <CalendarDays size={12} />
                            Created {formatDate(task.created_at)}
                          </span>
                          <span className="restore-meta-item">
                            <Trash2 size={12} />
                            Deleted {formatDate(task.deleted_at)}
                          </span>
                        </div>
                      </div>
                      <div className="restore-card-actions">
                        <button type="button" className="btn-secondary restore-action-btn" onClick={() => openModal("restore", task)}>
                          <RotateCcw size={16} />
                          <span>Restore</span>
                        </button>
                        <button type="button" className="btn-primary danger restore-action-btn" onClick={() => openModal("permanent", task)}>
                          <Trash2 size={16} />
                          <span>Delete Permanently</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <RotateCcw size={32} />
                  </div>
                  <h3>No deleted tasks</h3>
                  <p>Soft-deleted tasks will appear here until you restore or permanently remove them.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <ConfirmationModal
        open={modal.open}
        title={modal.type === "permanent" ? "Delete Permanently" : "Restore Task"}
        message={
          modal.type === "permanent"
            ? "This action cannot be undone. Are you sure?"
            : "Do you want to restore this task?"
        }
        confirmLabel={modal.type === "permanent" ? "Delete Permanently" : "Restore"}
        cancelLabel="Cancel"
        tone={modal.type === "permanent" ? "danger" : "success"}
        loading={modal.loading}
        error={modal.error}
        onConfirm={completeAction}
        onCancel={closeModal}
      />

      {toast.visible ? <Toast message={toast.message} onClose={() => setToast({ visible: false, message: "" })} /> : null}
    </div>
  );
}

export default RestorePage;