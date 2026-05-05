import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ExternalLink, Shield, UserCog, Wrench } from 'lucide-react'

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
import { Select } from '@/components/ui/Select'

function formatDt(iso: string) {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

type RoleChipVariant = 'admin' | 'manager' | 'editor' | 'default'

function getRoleChipVariant(roleName: string): RoleChipVariant {
  const normalized = roleName.trim().toLowerCase()
  if (normalized.includes('admin')) {
    return 'admin'
  }
  if (normalized.includes('manager')) {
    return 'manager'
  }
  if (normalized.includes('editor') || normalized.includes('content')) {
    return 'editor'
  }
  return 'default'
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

  function toggleCreateRole(roleName: string) {
    setCreateRoles((prev) => (prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]))
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
          <Select
            value={isActive}
            onChange={(next) => setIsActive(next as 'all' | 'true' | 'false')}
            options={[
              { value: 'all', label: t('admin.filters.allStatuses') },
              { value: 'true', label: t('admin.users.yes') },
              { value: 'false', label: t('admin.users.no') },
            ]}
          />
          <Select
            value={role}
            onChange={setRole}
            options={[
              { value: '', label: t('admin.filters.allRoles') },
              ...roles.map((r) => ({ value: r, label: r })),
            ]}
          />
          <Select
            value={sortBy}
            onChange={(next) => setSortBy(next as 'createdAtUtc' | 'email' | 'displayName' | 'active')}
            options={[
              { value: 'createdAtUtc', label: t('admin.users.created') },
              { value: 'email', label: t('admin.email') },
              { value: 'displayName', label: t('admin.users.displayName') },
              { value: 'active', label: t('admin.users.active') },
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
          <div className="admin-role-picker" role="group" aria-label={t('admin.filters.allRoles')}>
            {roles.map((r) => {
              const selected = createRoles.includes(r)
              const variant = getRoleChipVariant(r)
              const Icon = variant === 'admin' ? Shield : variant === 'manager' ? UserCog : variant === 'editor' ? Wrench : Shield
              return (
                <button
                  key={r}
                  type="button"
                  className={`admin-role-chip admin-role-chip--${variant}${selected ? ' admin-role-chip--selected' : ''}`}
                  onClick={() => toggleCreateRole(r)}
                  aria-pressed={selected}
                >
                  <Icon size={13} strokeWidth={2} />
                  {r}
                </button>
              )
            })}
          </div>
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
