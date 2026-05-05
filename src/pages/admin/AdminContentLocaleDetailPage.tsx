import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react'

import {
  fetchAdminContentAudit,
  fetchAdminContentLocale,
  saveAdminContentLocale,
  type AdminContentItem,
  type AdminContentAuditRow,
} from '@/api/adminApi'

function emptyRow(): AdminContentItem {
  return { key: '', value: '' }
}

export function AdminContentLocaleDetailPage() {
  const { t } = useTranslation()
  const { locale = '' } = useParams<{ locale: string }>()
  const [rows, setRows] = useState<AdminContentItem[]>([])
  const [auditRows, setAuditRows] = useState<AdminContentAuditRow[]>([])
  const [busy, setBusy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setBusy(true)
    setError(null)
    void Promise.all([fetchAdminContentLocale(locale), fetchAdminContentAudit(locale, 30)])
      .then(([detail, audit]) => {
        if (cancelled) {
          return
        }
        setRows(detail.items.length > 0 ? detail.items : [emptyRow()])
        setAuditRows(audit)
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
  }, [locale])

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const withIndex = rows.map((row, originalIndex) => ({ row, originalIndex }))
    if (!q) {
      return withIndex
    }
    return withIndex.filter((x) => x.row.key.toLowerCase().includes(q) || x.row.value.toLowerCase().includes(q))
  }, [rows, search])

  function updateRow(idx: number, patch: Partial<AdminContentItem>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  function validate() {
    const cleaned = rows.filter((r) => r.key.trim() || r.value.trim())
    const emptyKey = cleaned.find((r) => !r.key.trim())
    if (emptyKey) {
      return t('admin.contentEditor.validation.emptyKey')
    }
    const dup = cleaned
      .map((r) => r.key.trim())
      .filter((k, i, arr) => arr.indexOf(k) !== i)
    if (dup.length > 0) {
      return t('admin.contentEditor.validation.duplicateKey', { key: dup[0] })
    }
    return null
  }

  async function onSaveAll() {
    const validationError = validate()
    if (validationError) {
      toast.error(validationError)
      return
    }
    setSaving(true)
    try {
      const cleaned = rows
        .filter((r) => r.key.trim() || r.value.trim())
        .map((r) => ({ key: r.key.trim(), value: r.value }))
      const saved = await saveAdminContentLocale(locale, cleaned)
      setRows(saved.items.length > 0 ? saved.items : [emptyRow()])
      setAuditRows(await fetchAdminContentAudit(locale, 30))
      toast.success(t('admin.contentEditor.saved'))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
    } finally {
      setSaving(false)
    }
  }

  if (busy) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" aria-label={t('admin.loading')} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-page">
        <p className="admin-alert admin-alert--error">{error}</p>
        <Link className="admin-link" to="/admin/content">
          {t('admin.backToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{t('admin.contentEditor.localeTitle', { locale })}</h1>
        <div className="admin-row">
          <Link className="admin-btn admin-btn--ghost" to="/admin/content">
            <ArrowLeft size={14} strokeWidth={2} />
            {t('admin.backToList')}
          </Link>
          <button type="button" className="admin-btn admin-btn--primary" onClick={() => void onSaveAll()} disabled={saving}>
            <Save size={14} strokeWidth={2} />
            {saving ? t('admin.contentEditor.saving') : t('admin.contentEditor.saveAll')}
          </button>
        </div>
      </div>

      <div className="admin-card admin-card--flat">
        <h2 className="admin-card__title">{t('admin.contentEditor.title')}</h2>
        <div className="admin-users-filters">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('admin.contentEditor.search')} />
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setRows((prev) => [...prev, emptyRow()])}>
            <Plus size={14} strokeWidth={2} />
            {t('admin.contentEditor.newRow')}
          </button>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Key</th>
                <th>{t('admin.contentEditor.value')}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map(({ row, originalIndex }) => (
                <tr key={`${originalIndex}-${row.key}`}>
                  <td>
                    <input
                      value={row.key}
                      onChange={(e) => updateRow(originalIndex, { key: e.target.value })}
                      placeholder={t('admin.contentEditor.keyExample')}
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.value}
                      onChange={(e) => updateRow(originalIndex, { value: e.target.value })}
                      rows={2}
                    />
                  </td>
                  <td className="admin-table__actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => setRows((prev) => prev.filter((_, i) => i !== originalIndex))}
                    >
                      <Trash2 size={14} strokeWidth={2} />
                      {t('admin.actions.delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {visibleRows.length === 0 ? <p className="admin-empty">{t('admin.empty.noResults')}</p> : null}
      </div>

      <div className="admin-card admin-card--flat">
        <h2 className="admin-card__title">{t('admin.contentEditor.auditTitle')}</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('admin.logs.time')}</th>
                <th>Path</th>
                <th>{t('admin.logs.status')}</th>
                <th>{t('admin.logs.user')}</th>
                <th>{t('admin.logs.actionTitle')}</th>
              </tr>
            </thead>
            <tbody>
              {auditRows.map((a) => (
                <tr key={a.id}>
                  <td className="admin-muted admin-table__nowrap">{new Date(a.occurredAtUtc).toLocaleString()}</td>
                  <td className="admin-table__path">{a.path}</td>
                  <td>{a.statusCode}</td>
                  <td>{a.userEmail || '—'}</td>
                  <td>{a.actionTitle || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {auditRows.length === 0 ? <p className="admin-empty">{t('admin.empty.noAudit')}</p> : null}
      </div>
    </div>
  )
}
