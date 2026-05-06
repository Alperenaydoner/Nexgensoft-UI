import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'

import { fetchAdminLogs, type AdminHttpRequestLogListItem } from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'
import { AdminOverflowMenu } from '@/pages/admin/AdminOverflowMenu'

type AppliedFilters = { pathContains: string; statusCode: string; httpMethod: string }

export function AdminLogsPage() {
  const { t } = useTranslation()
  const [pathDraft, setPathDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState('')
  const [methodDraft, setMethodDraft] = useState('')
  const [applied, setApplied] = useState<AppliedFilters>({ pathContains: '', statusCode: '', httpMethod: '' })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<AdminHttpRequestLogListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    setError(null)
    const rawSc = applied.statusCode.trim()
    const parsedSc = rawSc === '' ? NaN : Number.parseInt(rawSc, 10)
    void fetchAdminLogs({
      page,
      pageSize: 25,
      pathContains: applied.pathContains.trim() || undefined,
      statusCode: rawSc === '' || !Number.isFinite(parsedSc) ? undefined : parsedSc,
      httpMethod: applied.httpMethod.trim() || undefined,
      fromUtc: undefined,
      toUtc: undefined,
    })
      .then((res) => {
        if (!cancelled) {
          setData(res)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [page, applied])

  function applyFilters() {
    setApplied({ pathContains: pathDraft, statusCode: statusDraft, httpMethod: methodDraft })
    setPage(1)
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <h1 className="admin-page__title">{t('admin.nav.logs')}</h1>
          <p className="admin-muted">{t('admin.logs.intro')}</p>
        </div>
      </div>

      <div className="admin-card admin-card--flat">
        <h2 className="admin-card__title">{t('admin.filters.title')}</h2>
        <div className="admin-users-filters">
          <input
            value={pathDraft}
            onChange={(e) => setPathDraft(e.target.value)}
            placeholder="/api/v1/contact"
          />
          <input
            value={methodDraft}
            onChange={(e) => setMethodDraft(e.target.value)}
            placeholder={t('admin.logs.method')}
          />
          <input value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} placeholder="200" />
          <div className="admin-filters__actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilters} disabled={busy}>
              {t('admin.logs.apply')}
            </button>
          </div>
        </div>
      </div>

      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {busy && !data ? <p className="admin-muted">{t('admin.loading')}</p> : null}
      {data ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.logs.time')}</th>
                  <th>{t('admin.logs.method')}</th>
                  <th>{t('admin.logs.path')}</th>
                  <th>{t('admin.logs.status')}</th>
                  <th>{t('admin.logs.duration')}</th>
                  <th>{t('admin.logs.user')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-table__nowrap admin-muted">{new Date(row.occurredAtUtc).toLocaleString()}</td>
                    <td>
                      <span className="admin-badge admin-badge--mono">{row.httpMethod}</span>
                    </td>
                    <td className="admin-table__path">{row.path}</td>
                    <td>
                      <span className={`admin-badge ${row.success ? 'admin-badge--ok' : 'admin-badge--err'}`}>
                        {row.statusCode}
                      </span>
                    </td>
                    <td>{row.durationMs} ms</td>
                    <td className="admin-muted">{row.userEmail || '—'}</td>
                    <td className="admin-table__actions">
                      <div className="admin-actions-inline">
                        <Link className="admin-icon-link" to={`/admin/logs/${row.id}`} aria-label={t('admin.viewDetail')}>
                          <ExternalLink size={14} strokeWidth={2} />
                        </Link>
                      </div>
                      <AdminOverflowMenu
                        label={t('admin.viewDetail')}
                        items={[{ key: 'detail', label: t('admin.viewDetail'), to: `/admin/logs/${row.id}` }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AdminPagination
            pageNumber={data.pageNumber}
            totalPages={data.totalPages}
            disabled={busy}
            onPageChange={(p) => setPage(p)}
          />
        </>
      ) : null}
    </div>
  )
}
