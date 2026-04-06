import { useId, useState, type ReactNode } from 'react'

type CollapsibleSectionProps = {
  title: string
  /** Extra classes on the outer `section` (e.g. `library-panel`). */
  className?: string
  /** When false (default), the body starts hidden. */
  defaultExpanded?: boolean
  children: ReactNode
}

export function CollapsibleSection({
  title,
  className = '',
  defaultExpanded = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultExpanded)
  const regionId = useId()
  const labelId = useId()

  return (
    <section
      className={`collapsible-section panel ${className}`.trim()}
      aria-labelledby={labelId}
    >
      <h2 className="panel__title collapsible-section__title">
        <button
          type="button"
          id={labelId}
          className="collapsible-section__toggle"
          aria-expanded={open}
          aria-controls={regionId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="collapsible-section__caret" aria-hidden>
            {open ? '▼' : '▶'}
          </span>
          {title}
        </button>
      </h2>
      <div
        id={regionId}
        role="region"
        aria-labelledby={labelId}
        hidden={!open}
        className="collapsible-section__body"
      >
        {children}
      </div>
    </section>
  )
}
