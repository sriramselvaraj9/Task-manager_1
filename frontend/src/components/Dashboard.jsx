import { useEffect, useState } from "react";
import API from "../services/api";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import Toast from "./Toast";
import TaskSidebar from "./TaskSidebar";
import ConfirmationModal from "./ConfirmationModal";
import AIChatbot from "./AIChatbot";
import { AlertCircle, CheckSquare, Clock, ListTodo, Mic, MicOff, Plus, Sparkles, X, Menu, Moon, Sun } from "lucide-react";

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

function Dashboard({ user, onLogout, theme, toggleTheme }) {
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

  const [showForm, setShowForm] = useState(false);
  const [draftTask, setDraftTask] = useState(null);
  const [voiceListening, setVoiceListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleTopVoiceAI = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast({ visible: true, message: "Voice recognition not supported in browser", type: "error" });
      return;
    }

    if (voiceListening) {
      setVoiceListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setVoiceListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          processVoiceCommand(transcript);
        }
      };

      recognition.onerror = () => {
        setVoiceListening(false);
      };

      recognition.onend = () => {
        setVoiceListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Speech error", e);
      setVoiceListening(false);
    }
  };

  const processVoiceCommand = async (text) => {
    const raw = text.trim();
    if (!raw) return;

    const tl = raw.toLowerCase();

    // 1) Check for Task Creation Intent locally first for instant execution
    const createIntents = ["create", "add", "make", "new task", "remind me", "set a task", "put a task", "schedule"];
    const hasCreateIntent = createIntents.some((kw) => tl.includes(kw));

    if (hasCreateIntent) {
      let title = "";
      let description = "";

      const descSplit = raw.split(/(?:\s+and)?\s+(?:description|details)\s*(?:is|:)?\s*/i);
      if (descSplit.length > 1) {
        title = descSplit[0].trim();
        description = descSplit.slice(1).join(" ").trim();
      } else {
        title = raw.trim();
      }

      title = title
        .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:i\s+want\s+to\s+)?/i, "")
        .replace(/^(?:create|add|make|set|put|schedule)\s+(?:a\s+)?(?:new\s+)?(?:task\s*)?(?:to|called|named|with\s+title)?\s*/i, "")
        .replace(/^(?:title\s*(?:is|=|:)?\s*)/i, "")
        .replace(/^remind\s+me\s+(?:to\s+)?/i, "")
        .replace(/^(?:with\s+that\.?\s*)?/i, "")
        .trim();

      title = title.replace(/\s+(?:due|by|priority|before)\s+.*$/i, "").trim();
      description = description.replace(/^(?:is|are|=|:)\s+/i, "").trim();

      if (title) {
        title = title.charAt(0).toUpperCase() + title.slice(1);
        const today = new Date();
        let due_date = today.toISOString().slice(0, 10);

        if (/\btomorrow\b/i.test(tl)) {
          const tom = new Date(today);
          tom.setDate(tom.getDate() + 1);
          due_date = tom.toISOString().slice(0, 10);
        } else if (/\bnext week\b/i.test(tl)) {
          const nw = new Date(today);
          nw.setDate(nw.getDate() + 7);
          due_date = nw.toISOString().slice(0, 10);
        } else {
          const dateMatch = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
          if (dateMatch) {
            due_date = dateMatch[1];
          }
        }

        let priority = "medium";
        if (/\b(high|urgent|important|critical)\b/i.test(tl)) {
          priority = "high";
        } else if (/\b(low|minor)\b/i.test(tl)) {
          priority = "low";
        }

        const start_date = today.toISOString().slice(0, 10);
        const payload = { title, description, start_date, due_date, priority, completed: false };

        setDraftTask(payload);
        setEditTask(null);
        setShowForm(true);
        setToast({
          visible: true,
          message: `Voice details filled into form! Click "Add Task" to confirm creation of "${title}".`,
          type: "info",
        });
        return;
      }
    }

    // 2) Handle Navigation & Filter Voice Commands locally when explicit action or target is present
    const isNavAction = /\b(list|give|show|what|filter|view|open|go to|display|navigate|navigate to|switch to)\b/.test(tl);
    const isExplicitNavTarget = /\b(completed page|completed section|completed tab|completed view|pending page|pending section|pending tab|upcoming page|upcoming section)\b/.test(tl);

    if (isNavAction || isExplicitNavTarget) {
      if (/\b(pending|incomplete|not done)\b/.test(tl)) {
        setSection("dashboard");
        setStatusFilter("pending");
        setSearchQuery("");
        setToast({ visible: true, message: "Filtered UI: Pending tasks", type: "success" });
        return;
      } else if (/\b(completed|done|finished)\b/.test(tl)) {
        setSection("completed");
        setStatusFilter("all");
        setSearchQuery("");
        setToast({ visible: true, message: "Navigated: Completed tasks", type: "success" });
        return;
      } else if (/\b(upcoming|due soon)\b/.test(tl)) {
        setSection("upcoming");
        setStatusFilter("all");
        setSearchQuery("");
        setToast({ visible: true, message: "Navigated: Upcoming tasks", type: "success" });
        return;
      } else if (/\b(all tasks|dashboard|home|my tasks)\b/.test(tl)) {
        setSection("dashboard");
        setStatusFilter("all");
        setSearchQuery("");
        setToast({ visible: true, message: "Showing all tasks", type: "success" });
        return;
      }
    }

    // 3) Fallback: Search or backend AI
    try {
      setLoading(true);
      const response = await API.post("/ai/chat", { message: raw });
      const data = response.data;
      if (data.result) {
        await fetchTasks();
      }
      setSearchQuery(raw);
    } catch (err) {
      console.error("Voice processing search fallback:", err);
      setSearchQuery(raw);
    } finally {
      setLoading(false);
    }
  };

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
      return true;
    } catch (err) {
      console.error("Error adding task:", err);
      const errMsg = err.response?.data?.detail || "Failed to create task.";
      setError(Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg);
      return false;
    }
  };

  const updateTask = async (taskId, taskData) => {
    setError("");
    try {
      const response = await API.put(`/tasks/${taskId}`, taskData);
      setTasks((prev) => prev.map((t) => (t.id === response.data.id ? response.data : t)));
      setToast({ visible: true, message: "Task updated successfully." });
      return true;
    } catch (err) {
      console.error("Error updating task:", err);
      const errMsg = err.response?.data?.detail || "Failed to update task.";
      setError(Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg);
      return false;
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
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
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
            <button
              type="button"
              className={`search-voice-ai-btn ${voiceListening ? "listening" : ""}`}
              onClick={handleTopVoiceAI}
              title={voiceListening ? "Listening... Speak command" : "Voice AI Command (Click & Speak)"}
            >
              <span className={`voice-badge ${voiceListening ? "pulsing" : ""}`}>
                {voiceListening ? <MicOff size={14} /> : <Mic size={14} />}
                {voiceListening ? "Listening..." : "Voice AI"}
              </span>
            </button>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className={`btn-primary-sm ${showForm ? "active" : ""}`}
              onClick={() => {
                setEditTask(null);
                setShowForm((prev) => !prev);
              }}
            >
              {showForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showForm ? "Close Form" : "New Task"}</span>
            </button>
            <div className="user-profile-sm">
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>{user?.email || "User"}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content full-width">
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

          {(showForm || editTask || draftTask) && (
            <div className="task-form-modal-overlay" onClick={() => { setShowForm(false); setEditTask(null); setDraftTask(null); }}>
              <div className="glass-panel form-panel task-form-modal-card" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0 }}>{editTask ? "Edit Task" : draftTask ? "Confirm New Task" : "Create Task"}</h2>
                  <button
                    type="button"
                    className="icon-btn small"
                    onClick={() => { setShowForm(false); setEditTask(null); setDraftTask(null); }}
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
                {draftTask && !editTask && (
                  <div className="alert info margin-bottom" style={{ marginBottom: 12 }}>
                    <span>✨ Form filled from voice command. Review details below and click <strong>Add Task</strong> to confirm.</span>
                  </div>
                )}
                <TaskForm
                  editTask={editTask}
                  initialData={draftTask}
                  onAdd={async (payload) => {
                    const ok = await addTask(payload);
                    if (ok) {
                      setShowForm(false);
                      setDraftTask(null);
                    }
                    return ok;
                  }}
                  onUpdate={async (id, payload) => {
                    const ok = await updateTask(id, payload);
                    if (ok) setEditTask(null);
                    return ok;
                  }}
                  onCancelEdit={() => { setEditTask(null); setDraftTask(null); }}
                  onToast={(msg, type) =>
                    setToast({ visible: true, message: msg, type: type || "success" })
                  }
                />
              </div>
            </div>
          )}
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

      <AIChatbot
        onTaskSync={fetchTasks}
        onNavigateSection={setSection}
        onFilterStatus={setStatusFilter}
        onSetSearchQuery={setSearchQuery}
        onFillTaskForm={(draftPayload) => {
          setDraftTask(draftPayload);
          setEditTask(null);
          setShowForm(true);
          setToast({
            visible: true,
            message: `Voice details filled! Click "Add Task" to confirm creation of "${draftPayload.title}".`,
            type: "info",
          });
        }}
      />
    </div>
  );
}

export default Dashboard;
