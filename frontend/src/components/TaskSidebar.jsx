import { NavLink } from "react-router-dom";
import { CheckSquare, Clock, ListTodo, LogOut, RotateCcw, Sparkles, X } from "lucide-react";

function TaskSidebar({
  mode = "dashboard",
  section = "dashboard",
  onSectionChange,
  onLogout,
  userEmail,
  upcomingCount = 0,
  pendingCount = 0,
  completedCount = 0,
  isOpen = false,
  onClose,
}) {
  const renderLinkClass = ({ isActive }) => `nav-item ${isActive ? "active" : ""}`;

  const handleNavClick = (sec) => {
    onSectionChange?.(sec);
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
        <div className="logo-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Sparkles className="logo-icon" />
            <h1>TaskFlow</h1>
          </div>
          <button type="button" className="sidebar-close-btn" onClick={onClose} aria-label="Close sidebar">
            <X size={20} />
          </button>
        </div>

        {mode === "dashboard" ? (
          <nav className="sidebar-nav">
            <button
              type="button"
              className={`nav-item ${section === "dashboard" ? "active" : ""}`}
              onClick={() => handleNavClick("dashboard")}
            >
              <ListTodo size={18} />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              className={`nav-item ${section === "upcoming" ? "active" : ""}`}
              onClick={() => handleNavClick("upcoming")}
            >
              <Clock size={18} />
              <span>Upcoming ({upcomingCount})</span>
            </button>
            <button
              type="button"
              className={`nav-item ${section === "completed" ? "active" : ""}`}
              onClick={() => handleNavClick("completed")}
            >
              <CheckSquare size={18} />
              <span>Completed</span>
            </button>
            <NavLink to="/restore" className={renderLinkClass} onClick={onClose}>
              <RotateCcw size={18} />
              <span>Restore</span>
            </NavLink>
          </nav>
        ) : (
          <nav className="sidebar-nav">
            <NavLink to="/" end className={renderLinkClass} onClick={onClose}>
              <ListTodo size={18} />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/restore" className={renderLinkClass} onClick={onClose}>
              <RotateCcw size={18} />
              <span>Restore</span>
            </NavLink>
          </nav>
        )}

        <div className="sidebar-user">
          <button onClick={onLogout} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default TaskSidebar;