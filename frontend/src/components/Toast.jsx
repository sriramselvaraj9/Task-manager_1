import { useEffect } from "react";
import { X } from "lucide-react";

function Toast({ message, onClose, duration = 5000, actionLabel, onAction }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="toast-container">
      <div className="toast-card">
        <div className="toast-content">
          <span>{message}</span>
          {actionLabel && onAction ? (
            <button className="toast-action-btn" onClick={onAction} type="button">
              <span>{actionLabel}</span>
            </button>
          ) : null}
        </div>
        <button className="toast-close-btn" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>
        <div 
          className="toast-progress" 
          style={{ animationDuration: `${duration}ms` }}
        />
      </div>
    </div>
  );
}

export default Toast;
