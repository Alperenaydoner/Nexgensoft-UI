import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PencilLine, Trash2 } from 'lucide-react'

import {
  createAdminRole,
  deleteAdminRole,
  fetchAdminRolesWithQuery,
  updateAdminRole,
  type AdminRoleListItem,
} from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'
import { AdminConfirmDialog, AdminPanelDialog, AdminPromptDialog } from '@/pages/admin/AdminDialogs'
import { AdminOverflowMenu } from '@/pages/admin/AdminOverflowMenu'

export function AdminRolesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<PagedResult<AdminRoleListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'normalizedName' | 'users'>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [newRoleName, setNewRoleName] = useState('')
  const [editRoleId, setEditRoleId] = useState<string | null>(null)
  const [editRoleName, setEditRoleName] = useState('')
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null)
  const [deleteRoleName, setDeleteRoleName] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      setData(
        await fetchAdminRolesWithQuery({
          page: p,
          pageSize: 20,
          query: query.trim() || undefined,
          sortBy,
          sortDir,
        }),
      )
      setPage(p)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }, [query, sortBy, sortDir])

  useEffect(() => {
    void load(1)
  }, [load])

  async function handleCreateRole() {
    if (!newRoleName.trim()) {
      return
    }
    try {
      await createAdminRole({ name: newRoleName.trim() })
      setNewRoleName('')
      setShowCreateModal(false)
      toast.success(t('admin.rolesCrud.created'))
      await load(1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
    }
  }

  async function confirmEditRole() {
    if (!editRoleId || !editRoleName.trim()) {
      return
    }
    try {
      await updateAdminRole(editRoleId, { name: editRoleName.trim() })
      toast.success(t('admin.rolesCrud.updated'))
      setEditRoleId(null)
      setEditRoleName('')
      await load(page)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
    }
  }

  async function confirmDeleteRole() {
    if (!deleteRoleId) {
      return
    }
    try {
      await deleteAdminRole(deleteRoleId)
      toast.success(t('admin.rolesCrud.deleted'))
      setDeleteRoleId(null)
      setDeleteRoleName('')
      await load(page)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{t('admin.nav.roles')}</h1>
        <button type="button" className="admin-btn admin-btn--primary" onClick={() => setShowCreateModal(true)}>
          {t('admin.actions.create')}
        </button>
      </div>
      <div className="admin-card">
        <h2 className="admin-card__title">{t('admin.filters.title')}</h2>
        <div className="admin-users-filters">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('admin.rolesCrud.searchPlaceholder')} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'normalizedName' | 'users')}>
            <option value="name">{t('admin.rolesTable.name')}</option>
            <option value="normalizedName">{t('admin.rolesTable.normalized')}</option>
            <option value="users">{t('admin.rolesTable.userCount')}</option>
          </select>
          <select value={sortDir} onChange={(e) => setSortDir(e.target.value as 'asc' | 'desc')}>
            <option value="asc">A-Z</option>
            <option value="desc">Z-A</option>
          </select>
          <div className="admin-filters__actions">
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void load(1)} disabled={busy}>
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
                  <th>{t('admin.rolesTable.name')}</th>
                  <th>{t('admin.rolesTable.normalized')}</th>
                  <th>{t('admin.rolesTable.userCount')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="admin-table__mono">{r.normalizedName}</td>
                    <td>{r.userCount}</td>
                    <td className="admin-table__actions">
                      <div className="admin-actions-inline">
                        <button
                          type="button"
                          className="admin-btn admin-btn--ghost"
                          onClick={() => {
                            setEditRoleId(r.id)
                            setEditRoleName(r.name)
                          }}
                        >
                          <PencilLine size={14} strokeWidth={2} />
                          <span>{t('admin.actions.update')}</span>
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => {
                            setDeleteRoleId(r.id)
                            setDeleteRoleName(r.name)
                          }}
                        >
                          <Trash2 size={14} strokeWidth={2} />
                          <span>{t('admin.actions.delete')}</span>
                        </button>
                      </div>
                      <AdminOverflowMenu
                        label={t('admin.actions.edit')}
                        items={[
                          {
                            key: 'edit',
                            label: t('admin.actions.update'),
                            onClick: () => {
                              setEditRoleId(r.id)
                              setEditRoleName(r.name)
                            },
                          },
                          {
                            key: 'delete',
                            label: t('admin.actions.delete'),
                            danger: true,
                            onClick: () => {
                              setDeleteRoleId(r.id)
                              setDeleteRoleName(r.name)
                            },
                          },
                        ]}
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
      <AdminPromptDialog
        open={Boolean(editRoleId)}
        title={t('admin.rolesCrud.editTitle')}
        value={editRoleName}
        placeholder={t('admin.rolesCrud.roleName')}
        confirmText={t('admin.actions.save')}
        cancelText={t('admin.actions.cancel')}
        onChange={setEditRoleName}
        onCancel={() => {
          setEditRoleId(null)
          setEditRoleName('')
        }}
        onConfirm={() => void confirmEditRole()}
      />
      <AdminConfirmDialog
        open={Boolean(deleteRoleId)}
        title={t('admin.rolesCrud.deleteTitle')}
        message={t('admin.rolesCrud.deleteMessage', { name: deleteRoleName })}
        confirmText={t('admin.actions.delete')}
        cancelText={t('admin.actions.cancel')}
        onCancel={() => {
          setDeleteRoleId(null)
          setDeleteRoleName('')
        }}
        onConfirm={() => void confirmDeleteRole()}
      />
      <AdminPanelDialog open={showCreateModal} title={t('admin.rolesCrud.newRoleTitle')} onClose={() => setShowCreateModal(false)}>
        <div className="admin-users-create admin-users-create--modal">
          <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder={t('admin.rolesCrud.roleName')} />
          <div className="admin-row">
            <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setShowCreateModal(false)}>
              {t('admin.actions.cancel')}
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => void handleCreateRole()}>
              {t('admin.actions.create')}
            </button>
          </div>
        </div>
      </AdminPanelDialog>
    </div>
  )
}
