import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ArrowLeft, PencilLine, Trash2 } from 'lucide-react'

import { deleteAdminUser, fetchAdminRoleOptions, fetchAdminUser, updateAdminUser, type AdminUserDetail } from '@/api/adminApi'
import { Select } from '@/components/ui/Select'
import { AdminConfirmDialog } from '@/pages/admin/AdminDialogs'

export function AdminUserDetailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<AdminUserDetail | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [password, setPassword] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  function toggleRole(roleName: string) {
    setSelectedRoles((prev) => (prev.includes(roleName) ? prev.filter((r) => r !== roleName) : [...prev, roleName]))
  }

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    void fetchAdminUser(id)
      .then((u) => {
        if (!cancelled) {
          setUser(u)
          setDisplayName(u.displayName)
          setIsActive(u.isActive)
          setSelectedRoles(u.roles)
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
        <div className="admin-row">
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => setEditing((v) => !v)}>
            <PencilLine size={14} strokeWidth={2} />
            {editing ? t('admin.actions.closeEdit') : t('admin.actions.edit')}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 size={14} strokeWidth={2} />
            {t('admin.actions.delete')}
          </button>
          <Link className="admin-btn admin-btn--ghost" to="/admin/users">
            <ArrowLeft size={14} strokeWidth={2} />
            {t('admin.backToList')}
          </Link>
        </div>
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
        {editing ? (
          <div className="admin-card admin-card--flat">
            <h2 className="admin-card__title">{t('admin.actions.update')}</h2>
            <div className="admin-users-create">
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('admin.users.displayName')} />
              <Select
                value={isActive ? 'true' : 'false'}
                onChange={(next) => setIsActive(next === 'true')}
                options={[
                  { value: 'true', label: t('admin.users.yes') },
                  { value: 'false', label: t('admin.users.no') },
                ]}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('admin.users.newPasswordOptional')}
              />
              <div className="admin-role-picker" role="group" aria-label={t('admin.roles')}>
                {roles.map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`admin-role-chip${selectedRoles.includes(r) ? ' admin-role-chip--selected' : ''}`}
                    onClick={() => toggleRole(r)}
                    aria-pressed={selectedRoles.includes(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={async () => {
                  if (!id || !user) {
                    return
                  }
                  try {
                    const updated = await updateAdminUser(id, {
                      email: user.email,
                      displayName: displayName.trim() || user.displayName,
                      isActive,
                      password: password.trim() || undefined,
                      roles: selectedRoles,
                    })
                    setUser(updated)
                    setPassword('')
                    setEditing(false)
                    toast.success(t('admin.usersCrud.updated'))
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
                  }
                }}
              >
                {t('admin.actions.save')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <AdminConfirmDialog
        open={showDeleteConfirm}
        title={t('admin.usersCrud.deleteTitle')}
        message={t('admin.usersCrud.deleteMessage', { email: user.email })}
        confirmText={t('admin.actions.delete')}
        cancelText={t('admin.actions.cancel')}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (!id) {
            return
          }
          try {
            await deleteAdminUser(id)
            toast.success(t('admin.usersCrud.deleted'))
            navigate('/admin/users')
          } catch (e) {
            toast.error(e instanceof Error ? e.message : t('admin.actions.failed'))
          } finally {
            setShowDeleteConfirm(false)
          }
        }}
      />
    </div>
  )
}
