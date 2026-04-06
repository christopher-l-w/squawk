import { useEffect, useId } from 'react'
import { createPortal } from 'react-dom'
import { PERSISTABLE_HEADER_LABELS } from '../lib/redactRequestHeaders'

type SaveHeadersModalProps = {
  headerNames: string[]
  onCancel: () => void
  onContinue: () => void
}

export function SaveHeadersModal({
  headerNames,
  onCancel,
  onContinue,
}: SaveHeadersModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const allowId = useId()
  const blockId = useId()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [onCancel])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal-dialog panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="modal-dialog__title">
          Some headers will not be saved
        </h2>
        <p id={descriptionId} className="modal-dialog__lede muted">
          Squawk only stores a fixed set of header names (no auth tokens or
          arbitrary custom headers). Anything else is omitted when you save.
        </p>

        <div className="modal-dialog__split">
          <div className="modal-dialog__pane modal-dialog__pane--allow">
            <p id={allowId} className="modal-dialog__pane-title">
              Allowed header names
            </p>
            <ul className="modal-dialog__chip-list" aria-labelledby={allowId}>
              {PERSISTABLE_HEADER_LABELS.map((label) => (
                <li key={label}>
                  <span className="modal-dialog__chip modal-dialog__chip--allow">
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="modal-dialog__pane modal-dialog__pane--block">
            <p id={blockId} className="modal-dialog__pane-title">
              Not saved from this request
            </p>
            <ul
              className="modal-dialog__chip-list modal-dialog__chip-list--block"
              aria-labelledby={blockId}
            >
              {headerNames.map((name) => (
                <li key={name}>
                  <span className="modal-dialog__chip modal-dialog__chip--block">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="modal-dialog__hint muted">
          You can add authentication and other headers again after loading this
          saved request.
        </p>
        <div className="modal-dialog__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={onContinue}
          >
            Save anyway
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
