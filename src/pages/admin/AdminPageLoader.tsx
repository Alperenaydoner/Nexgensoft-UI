import { useTranslation } from 'react-i18next'

type AdminPageLoaderProps = {
  label?: string
  compact?: boolean
}

export function AdminPageLoader({ label, compact = false }: AdminPageLoaderProps) {
  const { t } = useTranslation()
  const text = label ?? t('admin.loading')

  return (
    <div className={`admin-page-loader${compact ? ' admin-page-loader--compact' : ''}`} role="status" aria-live="polite">
      <div className="admin-page-loader__orb" aria-hidden="true">
        <span className="admin-page-loader__ring admin-page-loader__ring--a" />
        <span className="admin-page-loader__ring admin-page-loader__ring--b" />
        <span className="admin-page-loader__dot" />
      </div>
      <p className="admin-page-loader__text">{text}</p>
    </div>
  )
}

