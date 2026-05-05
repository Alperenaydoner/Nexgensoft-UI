import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ExternalLink } from 'lucide-react'

import {
  bulkDeleteAdminUsers,
  createAdminUser,
  fetchAdminRoleOptions,
  fetchAdminUsers,
  type AdminUserListItem,
} from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'
import { AdminConfirmDialog, AdminPanelDialog } from '@/pages/admin/AdminDialogs'
import { AdminOverflowMenu } from '@/pages/admin/AdminOverflowMenu'

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function AdminUsersPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<PagedResult<AdminUserListItem> | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [isActive, setIsActive] = useState<'all' | 'true' | 'false'>('all')
  const [role, setRole] = useState('')
  const [sortBy, setSortBy] = useState<'createdAtUtc' | 'email' | 'displayName' | 'active'>('createdAtUtc')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [createEmail, setCreateEmail] = useState('')
  const [createDisplayName, setCreateDisplayName] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createRoles, setCreateRoles] = useState<string[]>([])
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetchAdminUsers({
        page: p,
        pageSize: 20,
        query: query.trim() || undefined,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
        role: role || undefined,
        sortBy,
        sortDir,
      })
      setData(res)
      setPage(p)
      setSelectedIds([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }, [isActive, query, role, sortBy, sortDir])

  useEffect(() => {
    let cancelled = false
    void fetchAdminRoleOptions()
      .then((r) => {
        if (!cancelled) {
          setRoles(r.items)
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  const allChecked = useMemo(() => {
    if (!data || data.items.length === 0) {
      return false
    }
    return data.items.every((u) => selectedIds.includes(u.id))
  }, [data, selectedIds])

  async function handleCreateUser() {
    if (!createEmail.trim() || !createPassword.trim()) {
      toast.error(t('admin.usersCrud.emailPasswordRequired'))
      return
    }
    try {
      await createAdminUser({
        email: createEmail.trim(),
        displayName: createDisplayName.trim() || createEmail.trim(),
        password: createPassword,
        isActive: true,
        roles: createRoles,
      })
      setCreateEmail('')
      setCreateDisplayName('')
      setCreatePassword('')
      setCreateRoles([])
      setShowCreateModal(false)
      toast.success(t('admin.usersCrud.created'))
      await load(1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) {
      return
    }
    try {
      const res = await bulkDeleteAdminUsers(selectedIds)
      toast.success(t('admin.usersCrud.bulkDeleted', { count: res.deletedCount }))
      setShowBulkDeleteConfirm(false)
      await load(page)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{t('admin.nav.users')}</h1>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowCreateModal(true)}>
          {t('admin.actions.create')}
        </button>
      </div>
      <div className="admin-card">
        <h2 className="admin-card__title">{t('admin.filters.title')}</h2>
        <div className="admin-users-filters">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.usersCrud.searchPlaceholder')} />
          <select value={isActive} onChange={(e) => setIsActive(e.target.value as 'all' | 'true' | 'false')}>
            <option value="all">{t('admin.filters.allStatuses')}</option>
            <option value="true">{t('admin.users.yes')}</option>
            <option value="false">{t('admin.users.no')}</option>
          </select>
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">{t('admin.filters.allRoles')}</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'createdAtUtc' | 'email' | 'displayName' | 'active')}>
            <option value="createdAtUtc">{t('admin.users.created')}</option>
            <option value="email">{t('admin.email')}</option>
            <option value="displayName">{t('admin.users.displayName')}</option>
            <option value="active">{t('admin.users.active')}</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
            <option value="desc">{t('admin.filters.sortDesc')}</option>
            <option value="asc">{t('admin.filters.sortAsc')}</option>
          </select>
          <div className="admin-filters__actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void load(1)} disabled={busy}>
              {t('admin.logs.apply')}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={busy || selectedIds.length === 0}
            >
              {t('admin.actions.bulkDeleteSelected', { count: selectedIds.length })}
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
                  <th>
                    <input
                      type="checkbox"
                      checked={allChecked}
                      onChange={(e) => {
                        if (!data) {
                          return
                        }
                        if (e.target.checked) {
                          setSelectedIds(data.items.map((u) => u.id))
                        } else {
                          setSelectedIds([])
                        }
                      }}
                    />
                  </th>
                  <th>{t('admin.email')}</th>
                  <th>{t('admin.users.displayName')}</th>
                  <th>{t('admin.users.active')}</th>
                  <th>{t('admin.roles')}</th>
                  <th>{t('admin.users.created')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(u.id)}
                        onChange={(e) => {
                          setSelectedIds((prev) =>
                            e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id),
                          )
                        }}
                      />
                    </td>
                    <td>{u.email}</td>
                    <td>{u.displayName}</td>
                    <td>
                      <span className={`admin-badge ${u.isActive ? 'admin-badge--ok' : 'admin-badge--muted'}`}>
                        {u.isActive ? t('admin.users.yes') : t('admin.users.no')}
                      </span>
                    </td>
                    <td className="admin-table__mono">{u.roles?.join(', ') || '—'}</td>
                    <td className="admin-muted admin-table__nowrap">{formatDt(u.createdAtUtc)}</td>
                    <td className="admin-table__actions">
                      <div className="admin-actions-inline">
                        <Link className="admin-icon-link" to={`/admin/users/${u.id}`} aria-label={t('admin.viewDetail')}>
                          <ExternalLink size={14} strokeWidth={2} />
                        </Link>
                      </div>
                      <AdminOverflowMenu
                        label={t('admin.viewDetail')}
                        items={[{ key: 'detail', label: t('admin.viewDetail'), to: `/admin/users/${u.id}` }]}
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
            onPageChange={(p) => void load(p)}
          />
        </>
      ) : null}
      <AdminConfirmDialog
        open={showBulkDeleteConfirm}
        title={t('admin.actions.bulkDeleteTitle')}
        message={t('admin.actions.bulkDeleteMessage', { count: selectedIds.length })}
        confirmText={t('admin.actions.delete')}
        cancelText={t('admin.actions.cancel')}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        onConfirm={() => void handleBulkDelete()}
      />
      <AdminPanelDialog open={showCreateModal} title={t('admin.usersCrud.newUserTitle')} onClose={() => setShowCreateModal(false)}>
        <div className="admin-users-create admin-users-create--modal">
          <input value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder={t('admin.email')} />
          <input
            value={createDisplayName}
            onChange={(e) => setCreateDisplayName(e.target.value)}
            placeholder={t('admin.users.displayName')}
          />
          <input
            value={createPassword}
            onChange={(e) => setCreatePassword(e.target.value)}
            type="password"
            placeholder={t('admin.password')}
          />
          <select
            multiple
            value={createRoles}
            onChange={(e) => setCreateRoles(Array.from(e.target.selectedOptions).map((x) => x.value))}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <div className="admin-row">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowCreateModal(false)}>
              {t('admin.actions.cancel')}
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void handleCreateUser()}>
              {t('admin.actions.create')}
            </button>
          </div>
        </div>
      </AdminPanelDialog>
    </div>
  )
}
