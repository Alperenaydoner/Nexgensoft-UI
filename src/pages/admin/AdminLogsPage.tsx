import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { fetchAdminLogs, type AdminHttpRequestLogListItem } from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'

type AppliedFilters = { pathContains: string; statusCode: string }

export function AdminLogsPage() {
  const { t } = useTranslation()
  const [pathDraft, setPathDraft] = useState('')
  const [statusDraft, setStatusDraft] = useState('')
  const [applied, setApplied] = useState<AppliedFilters>({ pathContains: '', statusCode: '' })
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
    setApplied({ pathContains: pathDraft, statusCode: statusDraft })
    setPage(1)
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">{t('admin.nav.logs')}</h1>
      <p className="admin-muted">{t('admin.logs.intro')}</p>

      <div className="admin-filters">
        <label className="admin-field">
          <span>{t('admin.logs.pathContains')}</span>
          <input
            value={pathDraft}
            onChange={(e) => setPathDraft(e.target.value)}
            placeholder="/api/v1/contact"
          />
        </label>
        <label className="admin-field">
          <span>{t('admin.logs.statusCode')}</span>
          <input value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} placeholder="200" />
        </label>
        <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilters} disabled={busy}>
          {t('admin.logs.apply')}
        </button>
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
                    <td>
                      <Link className="admin-link" to={`/admin/logs/${row.id}`}>
                        {t('admin.viewDetail')}
                      </Link>
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
