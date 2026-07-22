import { useEffect, useState } from "react";
import API from "../services/api";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import Toast from "./Toast";
import TaskSidebar from "./TaskSidebar";
import ConfirmationModal from "./ConfirmationModal";
import AIChatbot from "./AIChatbot";
import { AlertCircle, CheckSquare, Clock, ListTodo, Sparkles } from "lucide-react";

const priorityWeight = {
  high: 0,
  medium: 1,
  low: 2,
};

const UPCOMING_WINDOW_DAYS = 7;

const parseDateOnly = (value) => {
  if (!value) return null;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const normalizeText = (value) => value.trim().toLowerCase();

const sortTasks = (left, right) => {
  const dueComparison = String(left.due_date || "").localeCompare(String(right.due_date || ""));
  if (dueComparison !== 0) {
    return dueComparison;
  }

  const leftPriority = priorityWeight[left.priority] ?? priorityWeight.medium;
  const rightPriority = priorityWeight[right.priority] ?? priorityWeight.medium;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.id - right.id;
};

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [section, setSection] = useState("dashboard"); // dashboard, upcoming, completed
  const [statusFilter, setStatusFilter] = useState("all"); // all, pending, completed
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [editTask, setEditTask] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const [deleteModal, setDeleteModal] = useState({ open: false, task: null, loading: false, error: "" });

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await API.get("/tasks");
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = async (taskData) => {
    setError("");
    try {
      const response = await API.post("/tasks", taskData);
      setTasks((prev) => [...prev, response.data]);
    } catch (err) {
      console.error("Error adding task:", err);
      const errMsg = err.response?.data?.detail || "Failed to create task.";
      setError(Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg);
    }
  };

  const updateTask = async (taskId, taskData) => {
    setError("");
    try {
      const response = await API.put(`/tasks/${taskId}`, taskData);
      setTasks((prev) => prev.map((t) => (t.id === response.data.id ? response.data : t)));
      setToast({ visible: true, message: "Task updated successfully." });
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task.");
    }
  };

  const deleteTask = async (id) => {
    const taskToDelete = tasks.find((task) => task.id === id);
    if (!taskToDelete) return;

    setDeleteModal({ open: true, task: taskToDelete, loading: false, error: "" });
  };

  const closeDeleteModal = () => {
    if (deleteModal.loading) return;
    setDeleteModal({ open: false, task: null, loading: false, error: "" });
  };

  const confirmDeleteTask = async () => {
    if (!deleteModal.task) return;

    setError("");
    setDeleteModal((current) => ({ ...current, loading: true, error: "" }));

    try {
      await API.delete(`/tasks/${deleteModal.task.id}`);
      setTasks((prev) => prev.filter((task) => task.id !== deleteModal.task.id));
      setToast({ visible: true, message: "Task moved to Restore." });
      closeDeleteModal();
    } catch (err) {
      console.error("Error deleting task:", err);
      const errMsg = err.response?.data?.detail || "Failed to delete task.";
      setDeleteModal((current) => ({ ...current, loading: false, error: Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg }));
    }
  };

  const toggleComplete = async (task) => {
    setError("");
    try {
      const response = await API.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        start_date: task.start_date,
        due_date: task.due_date,
        priority: task.priority,
        completed: !task.completed,
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? response.data : t))
      );
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task status.");
    }
  };

  const today = startOfToday();
  const upcomingLimit = new Date(today);
  upcomingLimit.setDate(upcomingLimit.getDate() + UPCOMING_WINDOW_DAYS);

  const sortedTasks = [...tasks].sort(sortTasks);

  const sectionTasks = sortedTasks.filter((task) => {
    const dueDate = parseDateOnly(task.due_date);

    if (section === "completed") {
      return task.completed;
    }

    if (section === "upcoming") {
      return !task.completed && dueDate && dueDate >= today && dueDate <= upcomingLimit;
    }

    return true;
  });

  const filteredTasks = sectionTasks.filter((task) => {
    if (statusFilter === "completed" && !task.completed) return false;
    if (statusFilter === "pending" && task.completed) return false;

    if (!searchQuery.trim()) return true;

    const query = normalizeText(searchQuery);
    return [task.title, task.description, task.priority, task.start_date, task.due_date]
      .filter(Boolean)
      .some((value) => normalizeText(String(value)).includes(query));
  });

  const pageCount = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, section]);

  const currentViewTitle =
    section === "upcoming"
      ? "Upcoming Tasks"
      : section === "completed"
        ? "Completed Tasks"
        : "My Tasks";

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;
  const upcomingCount = sortedTasks.filter((task) => {
    const dueDate = parseDateOnly(task.due_date);
    return !task.completed && dueDate && dueDate >= today && dueDate <= upcomingLimit;
  }).length;

  return (
    <div className="dashboard-container">
      <TaskSidebar
        mode="dashboard"
        section={section}
        onSectionChange={setSection}
        onLogout={onLogout}
        userEmail={user?.email}
        upcomingCount={upcomingCount}
      />

      {/* Main Content Area */}
      <div className="dashboard-main-content">
        {/* Top Navbar */}
        <header className="top-navbar">
          <div className="top-search">
            <Sparkles size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="top-actions">
            <div className="user-profile-sm">
              <div style={{width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000'}}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>{user?.email || "User"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <div className="main-feed">
            {/* Quick Stats Panel */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon all"><ListTodo size={24} /></div>
                <div className="stat-content">
                  <span className="stat-value">{tasks.length}</span>
                  <span className="stat-name">Total Tasks</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon pending"><Clock size={24} /></div>
                <div className="stat-content">
                  <span className="stat-value">{pendingCount}</span>
                  <span className="stat-name">Pending</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon completed"><CheckSquare size={24} /></div>
                <div className="stat-content">
                  <span className="stat-value">{completedCount}</span>
                  <span className="stat-name">Completed</span>
                </div>
              </div>
            </div>

            <div className="glass-panel list-panel">
              <div className="list-header">
                <h2>{currentViewTitle}</h2>
                <div className="filter-tabs">
                  <button
                    type="button"
                    className={`filter-tab ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${statusFilter === "pending" ? "active" : ""}`}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending ({pendingCount})
                  </button>
                  <button
                    type="button"
                    className={`filter-tab ${statusFilter === "completed" ? "active" : ""}`}
                    onClick={() => setStatusFilter("completed")}
                  >
                    Completed ({completedCount})
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert error margin-bottom">
                  <AlertCircle className="alert-icon" />
                  <span>{error}</span>
                </div>
              )}

              {loading ? (
                <div className="loading-state">
                  <span className="spinner large"></span>
                  <p>Loading your task workspace...</p>
                </div>
              ) : filteredTasks.length > 0 ? (
                <>
                  <TaskList
                    tasks={paginatedTasks}
                    deleteTask={deleteTask}
                    toggleComplete={toggleComplete}
                    onEdit={(task) => setEditTask(task)}
                  />
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="pagination-button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <div className="pagination-info">
                      Page {currentPage} of {pageCount} • Showing {paginatedTasks.length} of {filteredTasks.length}
                    </div>
                    <button
                      type="button"
                      className="pagination-button"
                      onClick={() => setCurrentPage((prev) => Math.min(pageCount, prev + 1))}
                      disabled={currentPage === pageCount}
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon-wrapper">
                    <Sparkles size={32} />
                  </div>
                  <h3>{searchQuery.trim() ? "No matching tasks" : "No tasks found"}</h3>
                  <p>
                    {searchQuery.trim()
                      ? "Try a different search term or clear the search box to see everything again."
                      : section === "upcoming"
                        ? "No tasks are due in the next 7 days."
                        : section === "completed"
                          ? "No completed tasks yet. Keep moving forward!"
                          : statusFilter === "pending"
                            ? "Hooray! No pending tasks left to do."
                            : "Get started by adding your very first task in the form to the right!"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <aside className="right-sidebar">
            <div className="glass-panel form-panel">
              <h2>{editTask ? "Edit Task" : "Create Task"}</h2>
              <TaskForm
                editTask={editTask}
                onAdd={addTask}
                onUpdate={(id, payload) => updateTask(id, payload)}
                onCancelEdit={() => setEditTask(null)}
                onToast={(msg, type) =>
                  setToast({ visible: true, message: msg, type: type || "success" })
                }
              />
            </div>
          </aside>
        </main>
      </div>

      <ConfirmationModal
        open={deleteModal.open}
        title="Delete Task"
        message="This task will be moved to the Restore page and can be restored later."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        loading={deleteModal.loading}
        error={deleteModal.error}
        onConfirm={confirmDeleteTask}
        onCancel={closeDeleteModal}
      />

      {toast.visible ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ visible: false, message: "", type: "success" })}
        />
      ) : null}

      <AIChatbot onTaskSync={fetchTasks} />
    </div>
  );
}

export default Dashboard;
