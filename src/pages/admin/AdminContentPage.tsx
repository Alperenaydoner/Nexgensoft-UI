import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'

import { fetchAdminContentOverview, type AdminContentOverview } from '@/api/adminApi'
import { AdminPagination } from '@/pages/admin/AdminPagination'
import { AdminOverflowMenu } from '@/pages/admin/AdminOverflowMenu'

function localeFlag(locale: string) {
  const normalized = locale.trim().toLowerCase()
  if (normalized === 'tr') {
    return '🇹🇷'
  }
  if (normalized === 'en') {
    return '🇬🇧'
  }
  return '🌐'
}

export function AdminContentPage() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<AdminContentOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localeQuery, setLocaleQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

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

  const filteredLocales = overview
    ? overview.locales.filter((x) => x.locale.toLowerCase().includes(localeQuery.trim().toLowerCase()))
    : []
  const totalPages = Math.max(1, Math.ceil(filteredLocales.length / pageSize))
  const pagedLocales = filteredLocales.slice((page - 1) * pageSize, page * pageSize)

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
          <div className="admin-card admin-card--flat">
            <h2 className="admin-card__title">{t('admin.filters.title')}</h2>
            <div className="admin-users-filters">
              <input
                value={localeQuery}
                onChange={(e) => {
                  setLocaleQuery(e.target.value)
                  setPage(1)
                }}
                placeholder={t('admin.content.searchLocale')}
              />
              <div className="admin-filters__actions">
                <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setLocaleQuery('')}>
                  {t('admin.actions.cancel')}
                </button>
              </div>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.content.locale')}</th>
                  <th>{t('admin.content.hasBundle')}</th>
                  <th>{t('admin.content.stringCount')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pagedLocales.map((row) => (
                  <tr key={row.locale}>
                    <td className="admin-table__mono">
                      <span className="admin-locale-tag">
                        <span>{localeFlag(row.locale)}</span>
                        <span>{row.locale}</span>
                      </span>
                    </td>
                    <td>{row.hasBundle ? t('admin.users.yes') : t('admin.users.no')}</td>
                    <td>{row.localizedStringCount}</td>
                    <td>
                      <div className="admin-actions-inline">
                        <Link className="admin-icon-link" to={`/admin/content/${row.locale}`} aria-label={t('admin.content.detailEdit')}>
                          <ExternalLink size={14} strokeWidth={2} />
                        </Link>
                      </div>
                      <AdminOverflowMenu
                        label={t('admin.content.detailEdit')}
                        items={[{ key: 'detail', label: t('admin.content.detailEdit'), to: `/admin/content/${row.locale}` }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            pageNumber={page}
            totalPages={totalPages}
            disabled={false}
            onPageChange={(p) => setPage(p)}
          />
          {filteredLocales.length === 0 ? (
            <p className="admin-empty">{t('admin.empty.noResults')}</p>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
