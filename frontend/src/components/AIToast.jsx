import { useEffect } from "react";

function AIToast({ message, visible, onClose }) {
  useEffect(() => {
    if (visible) {
      const timeout = setTimeout(onClose, 4200);
      return () => clearTimeout(timeout);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="ai-toast">
      <p>{message}</p>
    </div>
  );
}

export default AIToast;
