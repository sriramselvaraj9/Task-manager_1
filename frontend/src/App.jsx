import { useEffect, useState } from "react";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

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
    <div className="app-root">
      {token ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <div className="auth-wrapper">
          <Auth onLogin={handleLogin} />
        </div>
      )}
    </div>
  );
}

export default App;