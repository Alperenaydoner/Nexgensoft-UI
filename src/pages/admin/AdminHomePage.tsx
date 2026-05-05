import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import { BriefcaseBusiness, FileText, Files, Mail, MessageSquare, Shield, Type, Users } from 'lucide-react'
import { toast } from 'sonner'

import { adminPing, fetchAdminStats, type AdminStats } from '@/api/adminApi'
import { ApiError } from '@/api/httpClient'

import type { AdminOutletContext } from '@/pages/admin/AdminLayout'

type StatTone = 'users' | 'roles' | 'contact' | 'attachments' | 'apps' | 'logs' | 'content'

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  tone: StatTone
}) {
  return (
    <div className={`admin-stat-card admin-stat-card--${tone}`}>
      <span className="admin-stat-card__icon" aria-hidden="true">
        <Icon size={15} strokeWidth={2} />
      </span>
      <span className="admin-stat-card__value">{value}</span>
      <span className="admin-stat-card__label">{label}</span>
    </div>
  )
}

export function AdminHomePage() {
  const { t } = useTranslation()
  const { user } = useOutletContext<AdminOutletContext>()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [pingBusy, setPingBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchAdminStats()
      .then((s) => {
        if (!cancelled) {
          setStats(s)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onPing() {
    setPingBusy(true)
    try {
      const res = await adminPing()
      if (res.ok) {
        toast.success(t('admin.pingOk'))
      } else {
        toast.error(t('admin.pingFail'))
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast.error(t('admin.forbidden'))
      } else {
        toast.error(t('admin.pingFail'))
      }
    } finally {
      setPingBusy(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <div>
          <h1 className="admin-page__title">{t('admin.dashboardTitle')}</h1>
          <p className="admin-muted">{t('admin.welcome', { name: user.displayName || user.email })}</p>
        </div>
        <button type="button" className="admin-btn admin-btn--primary" disabled={pingBusy} onClick={onPing}>
          {t('admin.ping')}
        </button>
      </div>

      {loadError ? <p className="admin-alert admin-alert--error">{loadError}</p> : null}

      {stats ? (
        <div className="admin-stat-grid">
          <StatCard label={t('admin.stats.users')} value={stats.userCount} icon={Users} tone="users" />
          <StatCard label={t('admin.stats.roles')} value={stats.roleCount} icon={Shield} tone="roles" />
          <StatCard label={t('admin.stats.contactMessages')} value={stats.contactMessageCount} icon={MessageSquare} tone="contact" />
          <StatCard label={t('admin.stats.contactAttachments')} value={stats.contactAttachmentCount} icon={Mail} tone="attachments" />
          <StatCard label={t('admin.stats.jobApplications')} value={stats.jobApplicationCount} icon={BriefcaseBusiness} tone="apps" />
          <StatCard label={t('admin.stats.jobApplicationAttachments')} value={stats.jobApplicationAttachmentCount} icon={Files} tone="attachments" />
          <StatCard label={t('admin.stats.httpLogs')} value={stats.httpRequestLogCount} icon={FileText} tone="logs" />
          <StatCard label={t('admin.stats.contentBundles')} value={stats.siteContentBundleCount} icon={Type} tone="content" />
          <StatCard label={t('admin.stats.localizedStrings')} value={stats.siteLocalizedStringCount} icon={Type} tone="content" />
        </div>
      ) : !loadError ? (
        <p className="admin-muted">{t('admin.loading')}</p>
      ) : null}

      <div className="admin-card admin-card--flat">
        <h2 className="admin-card__title">{t('admin.quickLinks')}</h2>
        <div className="admin-quick-links">
          <Link className="admin-quick-link" to="/admin/users">
            {t('admin.nav.users')}
          </Link>
          <Link className="admin-quick-link" to="/admin/roles">
            {t('admin.nav.roles')}
          </Link>
          <Link className="admin-quick-link" to="/admin/contact">
            {t('admin.nav.contact')}
          </Link>
          <Link className="admin-quick-link" to="/admin/logs">
            {t('admin.nav.logs')}
          </Link>
          <Link className="admin-quick-link" to="/admin/applications">
            {t('admin.nav.applications')}
          </Link>
          <Link className="admin-quick-link" to="/admin/content">
            {t('admin.nav.content')}
          </Link>
        </div>
      </div>
    </div>
  )
}
