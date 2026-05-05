import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'
import { BriefcaseBusiness, FileText, Globe, LayoutGrid, Mail, Search, Shield, Users } from 'lucide-react'

import { getAdminAccessToken, setAdminAccessToken } from '@/admin/authStorage'
import type { CurrentUserDto } from '@/api/authApi'
import { fetchCurrentUser } from '@/api/authApi'
import {
  fetchAdminContactMessages,
  fetchAdminContentOverview,
  fetchAdminJobApplications,
  fetchAdminRolesWithQuery,
  fetchAdminUsers,
} from '@/api/adminApi'

import '@/pages/admin/admin.css'

export type AdminOutletContext = { user: CurrentUserDto }
type AdminSearchItem = {
  id: string
  label: string
  meta: string
  to: string
}

const navCls = ({ isActive }: { isActive: boolean }) =>
  `admin-nav__link${isActive ? ' admin-nav__link--active' : ''}`

type NavItem = {
  to: string
  key: string
  icon: LucideIcon
  end?: boolean
}

const navItems = [
  { to: '/admin', key: 'admin.nav.dashboard', icon: LayoutGrid, end: true },
  { to: '/admin/users', key: 'admin.nav.users', icon: Users },
  { to: '/admin/roles', key: 'admin.nav.roles', icon: Shield },
  { to: '/admin/contact', key: 'admin.nav.contact', icon: Mail },
  { to: '/admin/applications', key: 'admin.nav.applications', icon: BriefcaseBusiness },
  { to: '/admin/logs', key: 'admin.nav.logs', icon: FileText },
  { to: '/admin/content', key: 'admin.nav.content', icon: Globe },
] satisfies NavItem[]

export function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState<CurrentUserDto | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchItems, setSearchItems] = useState<AdminSearchItem[]>([])

  const breadcrumb = useMemo(() => {
    const parts = location.pathname.split('/').filter(Boolean).slice(1)
    const labelMap: Record<string, string> = {
      users: t('admin.nav.users'),
      roles: t('admin.nav.roles'),
      contact: t('admin.nav.contact'),
      applications: t('admin.nav.applications'),
      logs: t('admin.nav.logs'),
      content: t('admin.nav.content'),
    }
    const labels = [t('admin.title')]
    parts.forEach((p, idx) => {
      if (idx === 0) {
        labels.push(labelMap[p] ?? p)
        return
      }
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p)
      labels.push(isGuid ? t('admin.viewDetail') : p)
    })
    return labels.join(' > ')
  }, [location.pathname, t])

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

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      } else if (event.key === 'Escape') {
        setSearchOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!searchOpen || searchItems.length > 0) {
      return
    }
    let cancelled = false
    setSearchLoading(true)
    setSearchError(null)
    void Promise.all([
      fetchAdminUsers({ page: 1, pageSize: 8 }),
      fetchAdminRolesWithQuery({ page: 1, pageSize: 8 }),
      fetchAdminContactMessages(1, 8),
      fetchAdminJobApplications(1, 8),
      fetchAdminContentOverview(),
    ])
      .then(([users, roles, contacts, applications, content]) => {
        if (cancelled) {
          return
        }
        const items: AdminSearchItem[] = [
          ...users.items.map((u) => ({
            id: `user-${u.id}`,
            label: u.displayName || u.email,
            meta: `User • ${u.email}`,
            to: `/admin/users/${u.id}`,
          })),
          ...roles.items.map((r) => ({
            id: `role-${r.id}`,
            label: r.name,
            meta: `Role • ${r.userCount} users`,
            to: '/admin/roles',
          })),
          ...contacts.items.map((m) => ({
            id: `contact-${m.id}`,
            label: `${m.fullName} (${m.email})`,
            meta: 'Contact message',
            to: `/admin/contact/${m.id}`,
          })),
          ...applications.items.map((a) => ({
            id: `app-${a.id}`,
            label: `${a.fullName} (${a.position})`,
            meta: 'Job application',
            to: `/admin/applications/${a.id}`,
          })),
          ...content.locales.map((locale) => ({
            id: `content-${locale.locale}`,
            label: locale.locale,
            meta: `Content locale • ${locale.localizedStringCount} strings`,
            to: `/admin/content/${encodeURIComponent(locale.locale)}`,
          })),
        ]
        setSearchItems(items)
      })
      .catch((e) => {
        if (cancelled) {
          return
        }
        setSearchError(e instanceof Error ? e.message : 'Search load failed')
      })
      .finally(() => {
        if (!cancelled) {
          setSearchLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [searchOpen, searchItems.length])

  const filteredSearchItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      return searchItems
    }
    return searchItems.filter((item) => {
      return item.label.toLowerCase().includes(q) || item.meta.toLowerCase().includes(q)
    })
  }, [searchItems, searchQuery])

  function signOut() {
    setAdminAccessToken(null)
    navigate('/admin/login', { replace: true })
  }

  function openAdminSearch() {
    setSearchOpen(true)
  }

  function closeAdminSearch() {
    setSearchOpen(false)
    setSearchQuery('')
  }

  function goToSearchItem(to: string) {
    closeAdminSearch()
    navigate(to)
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
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navCls}>
              <span className="admin-nav__icon" aria-hidden="true">
                <item.icon size={16} strokeWidth={2} />
              </span>
              <span>{t(item.key)}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-shell__main">
        <header className="admin-topbar">
          <div className="admin-topbar__meta">
            <span className="admin-breadcrumb">{breadcrumb}</span>
            <span className="admin-topbar__user admin-muted">{user.displayName || user.email}</span>
          </div>
          <div className="admin-topbar__actions">
            <button type="button" className="admin-btn admin-btn--ghost admin-search-trigger" onClick={openAdminSearch}>
              <Search size={14} strokeWidth={2} />
              <span>Ctrl+K</span>
            </button>
            <NavLink to="/" className="admin-btn admin-btn--ghost">
              {t('admin.backToSite')}
            </NavLink>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={signOut}>
              {t('admin.signOut')}
            </button>
          </div>
        </header>
        <div className="admin-content">
          <div key={location.pathname} className="nx-route-fade">
            <Outlet context={{ user } satisfies AdminOutletContext} />
          </div>
        </div>
      </div>
      {searchOpen ? (
        <div className="admin-modal__backdrop" role="presentation" onClick={closeAdminSearch}>
          <div className="admin-modal admin-search-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__head">
              <h3 className="admin-modal__title">{t('admin.search.title')}</h3>
              <button type="button" className="admin-icon-btn" onClick={closeAdminSearch} aria-label={t('admin.search.close')}>
                ×
              </button>
            </div>
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('admin.search.placeholder')}
            />
            <div className="admin-search-results">
              {searchLoading ? <p className="admin-muted">{t('admin.loading')}</p> : null}
              {searchError ? <p className="admin-alert admin-alert--error">{searchError}</p> : null}
              {!searchLoading && !searchError && filteredSearchItems.length === 0 ? (
                <p className="admin-empty">{t('admin.empty.noResults')}</p>
              ) : null}
              {!searchLoading && !searchError
                ? filteredSearchItems.slice(0, 25).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="admin-search-item"
                      onClick={() => goToSearchItem(item.to)}
                    >
                      <span className="admin-search-item__label">{item.label}</span>
                      <span className="admin-search-item__meta">{item.meta}</span>
                    </button>
                  ))
                : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
