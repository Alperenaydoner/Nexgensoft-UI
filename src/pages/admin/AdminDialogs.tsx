type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function AdminConfirmDialog({
  open,
  title,
  message,
  confirmText,
  cancelText,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null
  }
  return (
    <div className="admin-modal__backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal__title">{title}</h3>
        <p className="admin-muted">{message}</p>
        <div className="admin-row">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={busy}>
            {cancelText}
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={onConfirm} disabled={busy}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

type PanelDialogProps = {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function AdminPanelDialog({ open, title, onClose, children }: PanelDialogProps) {
  if (!open) {
    return null
  }
  return (
    <div className="admin-modal__backdrop" role="presentation" onClick={onClose}>
      <div className="admin-modal admin-modal--panel" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal__head">
          <h3 className="admin-modal__title">{title}</h3>
          <button type="button" className="admin-icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

type PromptDialogProps = {
  open: boolean
  title: string
  value: string
  placeholder: string
  confirmText: string
  cancelText: string
  busy?: boolean
  onChange: (value: string) => void
  onConfirm: () => void
  onCancel: () => void
}

export function AdminPromptDialog({
  open,
  title,
  value,
  placeholder,
  confirmText,
  cancelText,
  busy,
  onChange,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  if (!open) {
    return null
  }
  return (
    <div className="admin-modal__backdrop" role="presentation" onClick={onCancel}>
      <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="admin-modal__title">{title}</h3>
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        <div className="admin-row">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={onCancel} disabled={busy}>
            {cancelText}
          </button>
          <button type="button" className="admin-btn admin-btn--primary" onClick={onConfirm} disabled={busy}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
