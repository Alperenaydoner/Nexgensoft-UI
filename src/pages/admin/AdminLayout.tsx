import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getAdminAccessToken, setAdminAccessToken } from '@/admin/authStorage'
import type { CurrentUserDto } from '@/api/authApi'
import { fetchCurrentUser } from '@/api/authApi'

import '@/pages/admin/admin.css'

export type AdminOutletContext = { user: CurrentUserDto }

const navCls = ({ isActive }: { isActive: boolean }) =>
  `admin-nav__link${isActive ? ' admin-nav__link--active' : ''}`

export function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<CurrentUserDto | null>(null)

  useEffect(() => {
    const token = getAdminAccessToken()
    if (!token) {
      navigate('/admin/login', { replace: true })
      return
    }
    let cancelled = false
    void fetchCurrentUser(token)
      .then((u) => {
        if (cancelled) {
          return
        }
        if (!u.roles?.includes('Admin')) {
          setAdminAccessToken(null)
          toast.error(t('admin.forbidden'))
          navigate('/', { replace: true })
          return
        }
        setUser(u)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        setAdminAccessToken(null)
        navigate('/admin/login', { replace: true })
      })
    return () => {
      cancelled = true
    }
  }, [navigate, t])

  function signOut() {
    setAdminAccessToken(null)
    navigate('/admin/login', { replace: true })
  }

  if (!user) {
    return (
      <div className="admin-root">
        <div className="admin-content admin-content--centered">
          <p className="admin-muted">{t('admin.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-root admin-root--app">
      <aside className="admin-sidebar" aria-label={t('admin.sidebarAria')}>
        <div className="admin-sidebar__brand">{t('admin.title')}</div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={navCls}>
            {t('admin.nav.dashboard')}
          </NavLink>
          <NavLink to="/admin/users" className={navCls}>
            {t('admin.nav.users')}
          </NavLink>
          <NavLink to="/admin/roles" className={navCls}>
            {t('admin.nav.roles')}
          </NavLink>
          <NavLink to="/admin/contact" className={navCls}>
            {t('admin.nav.contact')}
          </NavLink>
          <NavLink to="/admin/logs" className={navCls}>
            {t('admin.nav.logs')}
          </NavLink>
          <NavLink to="/admin/content" className={navCls}>
            {t('admin.nav.content')}
          </NavLink>
        </nav>
      </aside>
      <div className="admin-shell__main">
        <header className="admin-topbar">
          <span className="admin-topbar__user admin-muted">
            {user.displayName || user.email}
          </span>
          <div className="admin-topbar__actions">
            <NavLink to="/" className="admin-btn admin-btn--ghost">
              {t('admin.backToSite')}
            </NavLink>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={signOut}>
              {t('admin.signOut')}
            </button>
          </div>
        </header>
        <div className="admin-content">
          <Outlet context={{ user } satisfies AdminOutletContext} />
        </div>
      </div>
    </div>
  )
}
