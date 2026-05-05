import { useTranslation } from 'react-i18next'

type Props = {
  pageNumber: number
  totalPages: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function AdminPagination({ pageNumber, totalPages, onPageChange, disabled }: Props) {
  const { t } = useTranslation()
  if (totalPages <= 1) {
    return null
  }

  return (
    <div className="admin-pagination">
      <button
        type="button"
        className="admin-btn admin-btn--ghost admin-pagination__btn"
        disabled={disabled || pageNumber <= 1}
        onClick={() => onPageChange(pageNumber - 1)}
      >
        {t('admin.pagination.prev')}
      </button>
      <span className="admin-pagination__meta">
        {t('admin.pagination.pageOf', { current: pageNumber, total: totalPages })}
      </span>
      <button
        type="button"
        className="admin-btn admin-btn--ghost admin-pagination__btn"
        disabled={disabled || pageNumber >= totalPages}
        onClick={() => onPageChange(pageNumber + 1)}
      >
        {t('admin.pagination.next')}
      </button>
    </div>
  )
}
