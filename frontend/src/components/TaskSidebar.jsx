import { NavLink } from "react-router-dom";
import { CheckSquare, Clock, ListTodo, LogOut, RotateCcw, Sparkles } from "lucide-react";

function TaskSidebar({
  mode = "dashboard",
  section = "dashboard",
  onSectionChange,
  onLogout,
  userEmail,
  upcomingCount = 0,
  pendingCount = 0,
  completedCount = 0,
}) {
  const renderLinkClass = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

  return (
    <aside className="dashboard-sidebar">
      <div className="logo-section">
        <Sparkles className="logo-icon" />
        <h1>TaskFlow</h1>
      </div>

      {mode === "dashboard" ? (
        <nav className="sidebar-nav">
          <button
            type="button"
            className={`nav-item ${section === "dashboard" ? "active" : ""}`}
            onClick={() => onSectionChange?.("dashboard")}
          >
            <ListTodo size={18} />
            <span>Dashboard</span>
          </button>
          <button
            type="button"
            className={`nav-item ${section === "upcoming" ? "active" : ""}`}
            onClick={() => onSectionChange?.("upcoming")}
          >
            <Clock size={18} />
            <span>Upcoming ({upcomingCount})</span>
          </button>
          <button
            type="button"
            className={`nav-item ${section === "completed" ? "active" : ""}`}
            onClick={() => onSectionChange?.("completed")}
          >
            <CheckSquare size={18} />
            <span>Completed</span>
          </button>
          <NavLink to="/restore" className={renderLinkClass}>
            <RotateCcw size={18} />
            <span>Restore</span>
          </NavLink>
        </nav>
      ) : (
        <nav className="sidebar-nav">
          <NavLink to="/" end className={renderLinkClass}>
            <ListTodo size={18} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/restore" className={renderLinkClass}>
            <RotateCcw size={18} />
            <span>Restore</span>
          </NavLink>
        </nav>
      )}

      <div className="sidebar-user">
        <div className="sidebar-user-meta">
          <div className="sidebar-user-avatar">{userEmail?.charAt(0).toUpperCase() || "U"}</div>
          <span>{userEmail || "User"}</span>
        </div>
        <button onClick={onLogout} className="btn-logout" title="Sign Out">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default TaskSidebar;