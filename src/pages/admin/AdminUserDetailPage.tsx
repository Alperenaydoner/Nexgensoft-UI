import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { fetchAdminUser, type AdminUserDetail } from '@/api/adminApi'

export function AdminUserDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    void fetchAdminUser(id)
      .then((u) => {
        if (!cancelled) {
          setUser(u)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (error) {
    return (
      <div className="admin-page">
        <p className="admin-alert admin-alert--error">{error}</p>
        <Link className="admin-link" to="/admin/users">
          {t('admin.backToList')}
        </Link>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="admin-page">
        <p className="admin-muted">{t('admin.loading')}</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{user.email}</h1>
        <Link className="admin-btn admin-btn--ghost" to="/admin/users">
          {t('admin.backToList')}
        </Link>
      </div>
      <div className="admin-detail-grid">
        <div className="admin-card admin-card--flat">
          <h2 className="admin-card__title">{t('admin.users.profile')}</h2>
          <dl className="admin-dl">
            <dt>{t('admin.users.displayName')}</dt>
            <dd>{user.displayName}</dd>
            <dt>{t('admin.email')}</dt>
            <dd>{user.email}</dd>
            <dt>{t('admin.users.normalizedEmail')}</dt>
            <dd className="admin-table__mono">{user.normalizedEmail}</dd>
            <dt>{t('admin.users.active')}</dt>
            <dd>{user.isActive ? t('admin.users.yes') : t('admin.users.no')}</dd>
            <dt>{t('admin.roles')}</dt>
            <dd>{user.roles?.join(', ') || '—'}</dd>
            <dt>{t('admin.users.created')}</dt>
            <dd>{new Date(user.createdAtUtc).toLocaleString()}</dd>
          </dl>
        </div>
      </div>
    </div>
  )
}
