import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { fetchAdminContentOverview, type AdminContentOverview } from '@/api/adminApi'

export function AdminContentPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<AdminContentOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchAdminContentOverview()
      .then((o) => {
        if (!cancelled) {
          setOverview(o)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">{t('admin.nav.content')}</h1>
      <p className="admin-muted">{t('admin.content.intro')}</p>
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {!overview && !error ? <p className="admin-muted">{t('admin.loading')}</p> : null}
      {overview ? (
        <>
          <div className="admin-stat-grid admin-stat-grid--compact">
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{overview.bundleCount}</span>
              <span className="admin-stat-card__label">{t('admin.content.bundles')}</span>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-card__value">{overview.totalLocalizedStrings}</span>
              <span className="admin-stat-card__label">{t('admin.content.strings')}</span>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.content.locale')}</th>
                  <th>{t('admin.content.hasBundle')}</th>
                  <th>{t('admin.content.stringCount')}</th>
                </tr>
              </thead>
              <tbody>
                {overview.locales.map((row) => (
                  <tr key={row.locale}>
                    <td className="admin-table__mono">{row.locale}</td>
                    <td>{row.hasBundle ? t('admin.users.yes') : t('admin.users.no')}</td>
                    <td>{row.localizedStringCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  )
}
