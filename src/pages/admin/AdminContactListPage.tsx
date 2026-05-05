import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { fetchAdminContactMessages, type AdminContactMessageListItem } from '@/api/adminApi'
import type { PagedResult } from '@/api/types/dotnet-contract'

import { AdminPagination } from '@/pages/admin/AdminPagination'

export function AdminContactListPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<PagedResult<AdminContactMessageListItem> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(true)

  const load = useCallback(async (p: number) => {
    setBusy(true)
    setError(null)
    try {
      setData(await fetchAdminContactMessages(p, 20))
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
      <h1 className="admin-page__title">{t('admin.nav.contact')}</h1>
      <p className="admin-muted">{t('admin.contact.intro')}</p>
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}
      {busy && !data ? <p className="admin-muted">{t('admin.loading')}</p> : null}
      {data ? (
        <>
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
                    <td>
                      <Link className="admin-link" to={`/admin/contact/${m.id}`}>
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
