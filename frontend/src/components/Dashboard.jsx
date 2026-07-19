import { useEffect, useState } from "react";
import API from "../services/api";
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";
import { LogOut, CheckSquare, ListTodo, Clock, Sparkles, AlertCircle } from "lucide-react";

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all"); // 'all', 'pending', 'completed'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  const deleteTask = async (id) => {
    setError("");
    try {
      await API.delete(`/tasks/${id}`);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task.");
    }
  };

  const toggleComplete = async (task) => {
    setError("");
    try {
      const response = await API.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
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

  const filteredTasks = tasks.filter((task) => {
    if (filter === "completed") return task.completed;
    if (filter === "pending") return !task.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  return (
    <div className="dashboard-container">
      {/* Header / Navbar */}
      <header className="dashboard-header">
        <div className="logo-section">
          <Sparkles className="logo-icon" />
          <h1>TaskFlow</h1>
        </div>
        
        <div className="user-profile">
          <div className="user-info">
            <span className="user-label">Logged in as</span>
            <span className="user-email">{user?.email || "User"}</span>
          </div>
          <button onClick={onLogout} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="dashboard-main">
        {/* Sidebar / Form */}
        <section className="dashboard-sidebar">
          <div className="glass-panel form-panel">
            <h2>Create New Task</h2>
            <p className="panel-subtitle">Plan and track your next achievement.</p>
            <TaskForm onAdd={addTask} />
          </div>

          {/* Quick Stats Panel */}
          <div className="glass-panel stats-panel">
            <h3>Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <ListTodo className="stat-icon all" />
                <div className="stat-content">
                  <span className="stat-value">{tasks.length}</span>
                  <span className="stat-name">Total Tasks</span>
                </div>
              </div>
              <div className="stat-card">
                <Clock className="stat-icon pending" />
                <div className="stat-content">
                  <span className="stat-value">{pendingCount}</span>
                  <span className="stat-name">Pending</span>
                </div>
              </div>
              <div className="stat-card">
                <CheckSquare className="stat-icon completed" />
                <div className="stat-content">
                  <span className="stat-value">{completedCount}</span>
                  <span className="stat-name">Completed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tasks List Section */}
        <section className="dashboard-content">
          <div className="glass-panel list-panel">
            <div className="list-header">
              <h2>My Tasks</h2>
              
              {/* Filter Tabs */}
              <div className="filter-tabs">
                <button
                  className={`filter-tab ${filter === "all" ? "active" : ""}`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  className={`filter-tab ${filter === "pending" ? "active" : ""}`}
                  onClick={() => setFilter("pending")}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  className={`filter-tab ${filter === "completed" ? "active" : ""}`}
                  onClick={() => setFilter("completed")}
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
              <TaskList
                tasks={filteredTasks}
                deleteTask={deleteTask}
                toggleComplete={toggleComplete}
              />
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrapper">
                  <Sparkles size={36} />
                </div>
                <h3>No tasks found</h3>
                <p>
                  {filter === "all"
                    ? "Get started by adding your very first task in the form to the left!"
                    : filter === "pending"
                    ? "Hooray! No pending tasks left to do."
                    : "No completed tasks yet. Keep moving forward!"}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
