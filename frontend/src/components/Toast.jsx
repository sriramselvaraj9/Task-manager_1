import { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";

function Toast({ message, onUndo, onClose, duration = 5000 }) {
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
          <button className="toast-undo-btn" onClick={onUndo}>
            <RotateCcw size={16} />
            <span>Undo</span>
          </button>
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
