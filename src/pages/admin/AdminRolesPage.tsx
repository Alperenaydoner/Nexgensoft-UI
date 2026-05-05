import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { fetchAdminRoles, type AdminRoleListItem } from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'

export function AdminRolesPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<PagedResult<AdminRoleListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      setData(await fetchAdminRoles(p, 20))
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
      <h1 className="admin-page__title">{t('admin.nav.roles')}</h1>
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
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td className="admin-table__mono">{r.normalizedName}</td>
                    <td>{r.userCount}</td>
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
