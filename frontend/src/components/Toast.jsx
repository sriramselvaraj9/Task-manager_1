import { useEffect } from "react";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

function Toast({ message, onClose, duration = 5000, type = "success" }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const isError = type === "error";

  return (
    <div className="toast-container">
      <div className={`toast-card ${isError ? "toast-card--error" : ""}`}>
        <div className="toast-content">
          {isError ? (
            <AlertCircle size={16} className="toast-icon toast-icon--error" />
          ) : (
            <CheckCircle2 size={16} className="toast-icon toast-icon--success" />
          )}
          <span>{message}</span>
        </div>
        <button className="toast-close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <div
          className={`toast-progress ${isError ? "toast-progress--error" : ""}`}
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

export default Toast;
