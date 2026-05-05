import { Link } from 'react-router-dom'
import { MoreHorizontal } from 'lucide-react'

type OverflowItem = {
  key: string
  label: string
  to?: string
  danger?: boolean
  onClick?: () => void
}

type AdminOverflowMenuProps = {
  items: OverflowItem[]
  label: string
}

export function AdminOverflowMenu({ items, label }: AdminOverflowMenuProps) {
  return (
    <details className="admin-overflow">
      <summary className="admin-icon-link" aria-label={label}>
        <MoreHorizontal size={14} strokeWidth={2} />
      </summary>
      <div className="admin-overflow__menu" role="menu">
        {items.map((item) =>
          item.to ? (
            <Link
              key={item.key}
              className={`admin-overflow__item${item.danger ? ' admin-overflow__item--danger' : ''}`}
              to={item.to}
              role="menuitem"
            >
              {item.label}
            </Link>
          ) : (
            <button
              key={item.key}
              type="button"
              className={`admin-overflow__item${item.danger ? ' admin-overflow__item--danger' : ''}`}
              onClick={item.onClick}
              role="menuitem"
            >
              {item.label}
            </button>
          ),
        )}
      </div>
    </details>
  )
}
