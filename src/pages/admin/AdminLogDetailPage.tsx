import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'

import { fetchAdminLogDetail, type AdminHttpRequestLogDetail } from '@/api/adminApi'

export function AdminLogDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [log, setLog] = useState<AdminHttpRequestLogDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    void fetchAdminLogDetail(id)
      .then((l) => {
        if (!cancelled) {
          setLog(l)
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
        <Link className="admin-link" to="/admin/logs">
          {t('admin.backToList')}
        </Link>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="admin-page">
        <p className="admin-muted">{t('admin.loading')}</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{t('admin.logs.detailTitle')}</h1>
        <Link className="admin-btn admin-btn--ghost" to="/admin/logs">
          <ArrowLeft size={14} strokeWidth={2} />
          {t('admin.backToList')}
        </Link>
      </div>
      <div className="admin-card admin-card--flat">
        <dl className="admin-dl">
          <dt>{t('admin.logs.time')}</dt>
          <dd>{new Date(log.occurredAtUtc).toLocaleString()}</dd>
          <dt>{t('admin.logs.method')}</dt>
          <dd>{log.httpMethod}</dd>
          <dt>{t('admin.logs.path')}</dt>
          <dd className="admin-table__path">{log.path}</dd>
          <dt>{t('admin.logs.query')}</dt>
          <dd className="admin-table__mono">{log.queryString || '—'}</dd>
          <dt>{t('admin.logs.status')}</dt>
          <dd>{log.statusCode}</dd>
          <dt>{t('admin.logs.duration')}</dt>
          <dd>{log.durationMs} ms</dd>
          <dt>{t('admin.logs.user')}</dt>
          <dd>{log.userEmail || '—'}</dd>
          <dt>{t('admin.logs.userId')}</dt>
          <dd className="admin-table__mono">{log.userId || '—'}</dd>
          <dt>{t('admin.logs.roles')}</dt>
          <dd>{log.userRoles || '—'}</dd>
          <dt>{t('admin.logs.clientIp')}</dt>
          <dd>{log.clientIp || '—'}</dd>
          <dt>{t('admin.logs.userAgent')}</dt>
          <dd className="admin-pre admin-pre--small">{log.userAgent || '—'}</dd>
          <dt>{t('admin.logs.actionType')}</dt>
          <dd>{log.actionType || '—'}</dd>
          <dt>{t('admin.logs.actionTitle')}</dt>
          <dd>{log.actionTitle || '—'}</dd>
          <dt>{t('admin.logs.actionDescription')}</dt>
          <dd>{log.actionDescription || '—'}</dd>
          <dt>{t('admin.logs.bodySnippet')}</dt>
          <dd>
            <pre className="admin-pre">{log.requestBodySnippet || '—'}</pre>
          </dd>
          <dt>{t('admin.logs.exception')}</dt>
          <dd>
            {log.exceptionType ? (
              <pre className="admin-pre admin-pre--error">
                {log.exceptionType}: {log.exceptionMessage}
              </pre>
            ) : (
              '—'
            )}
          </dd>
        </dl>
      </div>
    </div>
  )
}
