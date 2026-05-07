import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'

import { fetchAdminContactMessages, type AdminContactMessageListItem } from '@/api/adminApi'
import { Select } from '@/components/ui/Select'
import type { PagedResult } from '@/api/types/dotnet-contract'
import { getDefaultLastHoursRangeLocal, localDatetimeToUtcIso } from '@/pages/admin/adminDateFilters'
import { AdminPageLoader } from '@/pages/admin/AdminPageLoader'

import { AdminPagination } from '@/pages/admin/AdminPagination'
import { AdminOverflowMenu } from '@/pages/admin/AdminOverflowMenu'

type AppliedFilters = {
  query: string
  hasAttachments: 'all' | 'yes' | 'no'
  fromUtc: string
  toUtc: string
  sortBy: 'createdAtUtc' | 'fullName' | 'email' | 'attachments'
  sortDir: 'asc' | 'desc'
}

export function AdminContactListPage() {
  const { t } = useTranslation()
  const defaultRange = getDefaultLastHoursRangeLocal()
  const [data, setData] = useState<PagedResult<AdminContactMessageListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [globalTotalCount, setGlobalTotalCount] = useState<number>(0)
  const [query, setQuery] = useState('')
  const [hasAttachments, setHasAttachments] = useState<'all' | 'yes' | 'no'>('all')
  const [fromLocal, setFromLocal] = useState(defaultRange.fromLocal)
  const [toLocal, setToLocal] = useState(defaultRange.toLocal)
  const [sortBy, setSortBy] = useState<'createdAtUtc' | 'fullName' | 'email' | 'attachments'>('createdAtUtc')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [applied, setApplied] = useState<AppliedFilters>({
    query: '',
    hasAttachments: 'all',
    fromUtc: defaultRange.fromLocal,
    toUtc: defaultRange.toLocal,
    sortBy: 'createdAtUtc',
    sortDir: 'desc',
  })

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      const [filtered, unfiltered] = await Promise.all([
        fetchAdminContactMessages(
          p,
          20,
          applied.query.trim() || undefined,
          applied.hasAttachments === 'all' ? undefined : applied.hasAttachments === 'yes',
          localDatetimeToUtcIso(applied.fromUtc),
          localDatetimeToUtcIso(applied.toUtc),
          applied.sortBy,
          applied.sortDir,
        ),
        fetchAdminContactMessages(1, 1, undefined, undefined, undefined, undefined, 'createdAtUtc', 'desc'),
      ])
      setData(filtered)
      setGlobalTotalCount(unfiltered.totalCount)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }, [applied])

  useEffect(() => {
    void load(1)
  }, [load])

  function applyFilters() {
    setApplied({
      query,
      hasAttachments,
      fromUtc: fromLocal,
      toUtc: toLocal,
      sortBy,
      sortDir,
    })
  }

  function useLast24Hours() {
    const next = getDefaultLastHoursRangeLocal()
    setFromLocal(next.fromLocal)
    setToLocal(next.toLocal)
    setApplied((prev) => ({ ...prev, fromUtc: next.fromLocal, toUtc: next.toLocal }))
  }

  function clearDateRange() {
    setFromLocal('')
    setToLocal('')
    setApplied((prev) => ({ ...prev, fromUtc: '', toUtc: '' }))
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <h1 className="admin-page__title">{t('admin.nav.contact')}</h1>
          <p className="admin-muted">{t('admin.contact.intro')}</p>
        </div>
      </div>
      <div className="admin-card admin-card--flat">
        <h2 className="admin-card__title">{t('admin.filters.title')}</h2>
        <div className="admin-users-filters admin-filters-grid">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.contact.searchPlaceholder')} />
          <Select
            value={hasAttachments}
            onChange={(next) => setHasAttachments(next as 'all' | 'yes' | 'no')}
            options={[
              { value: 'all', label: t('admin.contact.allRecords') },
              { value: 'yes', label: t('admin.contact.withAttachments') },
              { value: 'no', label: t('admin.contact.withoutAttachments') },
            ]}
          />
          <Select
            value={sortBy}
            onChange={(next) => setSortBy(next as 'createdAtUtc' | 'fullName' | 'email' | 'attachments')}
            options={[
              { value: 'createdAtUtc', label: t('admin.contact.received') },
              { value: 'fullName', label: t('admin.contact.from') },
              { value: 'email', label: t('admin.email') },
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
          <div className="admin-field admin-field--datetime">
            <label>{t('admin.filters.fromDate')}</label>
            <input type="datetime-local" value={fromLocal} onChange={(e) => setFromLocal(e.target.value)} />
          </div>
          <div className="admin-field admin-field--datetime">
            <label>{t('admin.filters.toDate')}</label>
            <input type="datetime-local" value={toLocal} onChange={(e) => setToLocal(e.target.value)} />
          </div>
          <div className="admin-filters__actions">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={useLast24Hours} disabled={busy}>
              {t('admin.filters.last24Hours')}
            </button>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={clearDateRange} disabled={busy}>
              {t('admin.filters.clearDate')}
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={applyFilters} disabled={busy}>
              {t('admin.logs.apply')}
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {busy && !data ? <AdminPageLoader /> : null}
      {data ? (
        <>
          <div className="admin-results-summary">
            <div className="admin-results-chip">
              <span className="admin-results-chip__label">{t('admin.filters.totalRecords')}</span>
              <strong>{globalTotalCount}</strong>
            </div>
            <div className="admin-results-chip">
              <span className="admin-results-chip__label">{t('admin.filters.shownRecords')}</span>
              <strong>{data.totalCount}</strong>
            </div>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.contact.from')}</th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.contact.company')}</th>
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
                    <td>{m.company || '—'}</td>
                    <td>{m.attachmentCount}</td>
                    <td className="admin-muted admin-table__nowrap">{new Date(m.createdAtUtc).toLocaleString()}</td>
                    <td className="admin-table__actions">
                      <div className="admin-actions-inline">
                        <Link className="admin-icon-link" to={`/admin/contact/${m.id}`} aria-label={t('admin.viewDetail')}>
                          <ExternalLink size={14} strokeWidth={2} />
                        </Link>
                      </div>
                      <AdminOverflowMenu
                        label={t('admin.viewDetail')}
                        items={[{ key: 'detail', label: t('admin.viewDetail'), to: `/admin/contact/${m.id}` }]}
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
