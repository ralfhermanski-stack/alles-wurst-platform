"use client";

type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function AdminConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Abbrechen",
  destructive = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-md rounded-xl border border-aw-border bg-aw-surface p-5 shadow-xl">
        <h3
          id="confirm-dialog-title"
          className="font-display text-lg font-bold text-aw-cream"
        >
          {title}
        </h3>
        <p className="mt-3 whitespace-pre-line text-sm text-aw-muted">{message}</p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-aw-border px-4 py-2 text-sm text-aw-cream transition hover:bg-aw-charcoal/60"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              destructive
                ? "bg-red-600 text-white hover:bg-red-500"
                : "bg-aw-gold text-aw-bg hover:bg-aw-gold/90"
            }`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
