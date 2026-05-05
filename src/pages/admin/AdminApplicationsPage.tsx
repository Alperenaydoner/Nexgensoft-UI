import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'

import { fetchAdminJobApplications, type AdminJobApplicationListItem } from '@/api/adminApi'
import { fetchApplicationPositions } from '@/api/applicationApi'
import { Select } from '@/components/ui/Select'
import type { PagedResult } from '@/api/types/dotnet-contract'
import { AdminOverflowMenu } from '@/pages/admin/AdminOverflowMenu'
import { AdminPagination } from '@/pages/admin/AdminPagination'

export function AdminApplicationsPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<PagedResult<AdminJobApplicationListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [query, setQuery] = useState('')
  const [position, setPosition] = useState('')
  const [positions, setPositions] = useState<string[]>([])
  const [hasAttachments, setHasAttachments] = useState<'all' | 'yes' | 'no'>('all')
  const [fromUtc, setFromUtc] = useState('')
  const [toUtc, setToUtc] = useState('')
  const [sortBy, setSortBy] = useState<'createdAtUtc' | 'fullName' | 'email' | 'position' | 'attachments'>('createdAtUtc')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      setData(
        await fetchAdminJobApplications(
          p,
          20,
          query.trim() || undefined,
          position.trim() || undefined,
          hasAttachments === 'all' ? undefined : hasAttachments === 'yes',
          fromUtc || undefined,
          toUtc || undefined,
          sortBy,
          sortDir,
        ),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }, [fromUtc, hasAttachments, position, query, sortBy, sortDir, toUtc])

  useEffect(() => {
    void load(1)
  }, [load])

  useEffect(() => {
    let cancelled = false
    void fetchApplicationPositions()
      .then((items) => {
        if (cancelled) {
          return
        }
        setPositions(items.map((x) => x.value).filter(Boolean))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{t('admin.nav.applications')}</h1>
      </div>
      <div className="admin-card admin-card--flat">
        <h2 className="admin-card__title">{t('admin.filters.title')}</h2>
        <div className="admin-users-filters">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.applications.searchPlaceholder')} />
          <Select
            value={position}
            onChange={setPosition}
            options={[{ value: '', label: t('admin.filters.allPositions') }, ...positions.map((p) => ({ value: p, label: p }))]}
          />
          <Select
            value={hasAttachments}
            onChange={(next) => setHasAttachments(next as 'all' | 'yes' | 'no')}
            options={[
              { value: 'all', label: t('admin.contact.allRecords') },
              { value: 'yes', label: t('admin.contact.withAttachments') },
              { value: 'no', label: t('admin.contact.withoutAttachments') },
            ]}
          />
          <input type="datetime-local" value={fromUtc} onChange={(e) => setFromUtc(e.target.value)} />
          <input type="datetime-local" value={toUtc} onChange={(e) => setToUtc(e.target.value)} />
          <Select
            value={sortBy}
            onChange={(next) => setSortBy(next as 'createdAtUtc' | 'fullName' | 'email' | 'position' | 'attachments')}
            options={[
              { value: 'createdAtUtc', label: t('admin.contact.received') },
              { value: 'fullName', label: t('admin.contact.from') },
              { value: 'email', label: t('admin.email') },
              { value: 'position', label: t('admin.applications.position') },
              { value: 'attachments', label: t('admin.contact.attachments') },
            ]}
          />
          <Select
            value={sortDir}
            onChange={(next) => setSortDir(next as 'asc' | 'desc')}
            options={[
              { value: 'desc', label: t('admin.filters.sortDesc') },
              { value: 'asc', label: t('admin.filters.sortAsc') },
            ]}
          />
          <div className="admin-filters__actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void load(1)} disabled={busy}>
              {t('admin.logs.apply')}
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {busy && !data ? <div className="admin-skeleton" aria-label={t('admin.loading')} /> : null}
      {data ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.contact.from')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.applications.position')}</th>
                  <th>{t('admin.contact.attachments')}</th>
                  <th>{t('admin.contact.received')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((m) => (
                  <tr key={m.id}>
                    <td>{m.fullName}</td>
                    <td>{m.email}</td>
                    <td>{m.position}</td>
                    <td>{m.attachmentCount}</td>
                    <td className="admin-muted admin-table__nowrap">{new Date(m.createdAtUtc).toLocaleString()}</td>
                    <td className="admin-table__actions">
                      <div className="admin-actions-inline">
                        <Link className="admin-icon-link" to={`/admin/applications/${m.id}`} aria-label={t('admin.viewDetail')}>
                          <ExternalLink size={14} strokeWidth={2} />
                        </Link>
                      </div>
                      <AdminOverflowMenu
                        label={t('admin.viewDetail')}
                        items={[{ key: 'detail', label: t('admin.viewDetail'), to: `/admin/applications/${m.id}` }]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.items.length === 0 ? <p className="admin-empty">{t('admin.empty.noResults')}</p> : null}
          <AdminPagination
            pageNumber={data.pageNumber}
            totalPages={data.totalPages}
            disabled={busy}
            onPageChange={(p) => void load(p)}
          />
        </>
      ) : null}
    </div>
  )
}
