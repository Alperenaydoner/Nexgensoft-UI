import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { fetchAdminUsers, type AdminUserListItem } from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'

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
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetchAdminUsers(p, 20)
      setData(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    void load(1)
  }, [load])

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">{t('admin.nav.users')}</h1>
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {busy && !data ? <p className="admin-muted">{t('admin.loading')}</p> : null}
      {data ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
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
                    <td>{u.email}</td>
                    <td>{u.displayName}</td>
                    <td>
                      <span className={`admin-badge ${u.isActive ? 'admin-badge--ok' : 'admin-badge--muted'}`}>
                        {u.isActive ? t('admin.users.yes') : t('admin.users.no')}
                      </span>
                    </td>
                    <td className="admin-table__mono">{u.roles?.join(', ') || '—'}</td>
                    <td className="admin-muted admin-table__nowrap">{formatDt(u.createdAtUtc)}</td>
                    <td>
                      <Link className="admin-link" to={`/admin/users/${u.id}`}>
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
            onPageChange={(p) => void load(p)}
          />
        </>
      ) : null}
    </div>
  )
}
