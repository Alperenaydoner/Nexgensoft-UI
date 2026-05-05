import { FormEvent, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { getAdminAccessToken, setAdminAccessToken } from '@/admin/authStorage'
import { ApiError } from '@/api/httpClient'
import { fetchCurrentUser, loginAdmin } from '@/api/authApi'

import '@/pages/admin/admin.css'

export function AdminLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const token = getAdminAccessToken()
    if (!token) {
      return
    }
    void fetchCurrentUser(token)
      .then((u) => {
        if (u.roles?.includes('Admin')) {
          navigate('/admin', { replace: true })
        }
      })
      .catch(() => {
        setAdminAccessToken(null)
      })
  }, [navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await loginAdmin(email.trim(), password)
      if (!res.user?.roles?.includes('Admin')) {
        toast.error(t('admin.forbidden'))
        return
      }
      setAdminAccessToken(res.accessToken)
      toast.success(t('admin.signedIn'))
      navigate('/admin', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error(t('admin.invalidCredentials'))
      } else {
        toast.error(err instanceof Error ? err.message : t('admin.pingFail'))
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-root">
      <div className="admin-login-wrap">
        <div className="admin-login-card">
          <h1>{t('admin.loginTitle')}</h1>
          <p className="admin-muted">{t('admin.title')}</p>
          <form className="admin-form" onSubmit={onSubmit} style={{ marginTop: '1.25rem' }}>
            <div className="admin-field">
              <label htmlFor="admin-email">{t('admin.email')}</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                required
              />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">{t('admin.password')}</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                required
                minLength={8}
              />
            </div>
            <button className="admin-btn admin-btn--primary" type="submit" disabled={busy}>
              {busy ? t('admin.signingIn') : t('admin.signIn')}
            </button>
          </form>
          <p className="admin-muted" style={{ marginTop: '1.25rem' }}>
            <Link to="/">{t('admin.backToSite')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
