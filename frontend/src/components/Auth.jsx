import { useEffect, useState } from "react";
import API from "../services/api";
import { Mail, Lock, LogIn, UserPlus, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCredentialResponse = async (response) => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await API.post("/auth/google", {
        credential: response.credential,
      });
      const { access_token, email: userEmail } = res.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify({ email: userEmail }));

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        onLogin(access_token, { email: userEmail });
      }, 800);
    } catch (err) {
      console.error("Google Auth error:", err);
      const errMsg = err.response?.data?.detail || "Google login failed. Please try again.";
      setError(Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "762046660429-82kidovkkm6d2cljkdq9sgqraq34i03a.apps.googleusercontent.com",
          callback: handleCredentialResponse,
        });
        const btnElem = document.getElementById("google-signin-btn");
        if (btnElem) {
          window.google.accounts.id.renderButton(btnElem, {
            theme: "outline",
            size: "large",
            width: btnElem.offsetWidth || 380,
          });
        }
      }
    };

    const loadGoogleScript = () => {
      if (document.getElementById("google-gsi-client")) {
        initializeGoogleSignIn();
        return;
      }
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, [isLogin]);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Front-end validations
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        const response = await API.post("/auth/login", {
          email: email.trim(),
          password: password,
        });

        const { access_token } = response.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify({ email: email.trim() }));

        setSuccess("Login successful! Redirecting...");
        setTimeout(() => {
          onLogin(access_token, { email: email.trim() });
        }, 800);
      } else {
        // Registration flow
        await API.post("/auth/register", {
          email: email.trim(),
          password: password,
        });

        setSuccess("Account created successfully! Logging you in...");

        // Auto-login after registration for seamless UX
        const loginResponse = await API.post("/auth/login", {
          email: email.trim(),
          password: password,
        });

        const { access_token } = loginResponse.data;
        localStorage.setItem("token", access_token);
        localStorage.setItem("user", JSON.stringify({ email: email.trim() }));

        setTimeout(() => {
          onLogin(access_token, { email: email.trim() });
        }, 1000);
      }
    } catch (err) {
      console.error("Auth error:", err);
      const errMsg = err.response?.data?.detail || "An error occurred. Please try again.";
      setError(Array.isArray(errMsg) ? errMsg[0]?.msg : errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon-wrapper">
          {isLogin ? <LogIn className="auth-icon" /> : <UserPlus className="auth-icon" />}
        </div>
        <h2>{isLogin ? "Sign In to TaskFlow" : "Create your Account"}</h2>
        <p className="auth-subtitle">
          {isLogin
            ? "Welcome back! Enter your details to view your tasks."
            : "Get started today. Manage your work with speed and style."}
        </p>
      </div>

      {error && (
        <div className="alert error">
          <AlertCircle className="alert-icon" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="alert success">
          <CheckCircle className="alert-icon" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <Mail className="input-icon" />
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {!isLogin && (
          <div className="input-group animated-field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        )}

        <button type="submit" className="btn-primary auth-submit" disabled={loading}>
          {loading ? (
            <span className="spinner"></span>
          ) : isLogin ? (
            <>
              <span>Sign In</span>
              <LogIn size={18} />
            </>
          ) : (
            <>
              <span>Get Started</span>
              <UserPlus size={18} />
            </>
          )}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <div className="google-auth-container">
        <div id="google-signin-btn"></div>
      </div>

      <div className="auth-footer">
        <span>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" className="btn-link" onClick={handleToggleMode} disabled={loading}>
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </span>
      </div>
    </div>
  );
}

export default Auth;
