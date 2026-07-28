import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import RestorePage from "./components/RestorePage";
import "./App.css";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Restore session from localStorage on initialization
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user details from local storage:", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    setInitializing(false);
  }, []);

  const handleLogin = (savedToken, savedUser) => {
    setToken(savedToken);
    setUser(savedUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  if (initializing) {
    return (
      <div className="init-screen">
        <span className="spinner large"></span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-root">
        {token ? (
          <Routes>
            <Route path="/" element={<Dashboard user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />} />
            <Route path="/restore" element={<RestorePage user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          <div className="auth-wrapper">
            <Auth onLogin={handleLogin} />
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}

export default App;