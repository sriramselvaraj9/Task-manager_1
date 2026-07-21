import { X } from "lucide-react";

function ConfirmationModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  loading = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onClick={onCancel}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="modal-close" onClick={onCancel} aria-label="Close dialog">
          <X size={18} />
        </button>
        <div className="modal-header">
          <div className={`modal-icon ${tone}`}>{tone === "danger" ? "🗑️" : "↩️"}</div>
          <div>
            <h3 id="confirmation-modal-title">{title}</h3>
            <p>{message}</p>
          </div>
        </div>

        {error ? <div className="modal-error">{error}</div> : null}

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className={`btn-primary ${tone === "danger" ? "danger" : "success"}`} onClick={onConfirm} disabled={loading}>
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;