import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { fetchAdminContactAttachmentBlob, fetchAdminContactMessage, type AdminContactMessageDetail } from '@/api/adminApi'

export function AdminContactDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const [msg, setMsg] = useState<AdminContactMessageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [blobUrls, setBlobUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) {
      return
    }
    let cancelled = false
    void fetchAdminContactMessage(id)
      .then((m) => {
        if (!cancelled) {
          setMsg(m)
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
    if (!msg?.id) {
      return
    }
    let alive = true
    const objectUrls: string[] = []
    setBlobUrls({})
    void (async () => {
      const next: Record<string, string> = {}
      for (const a of msg.attachments) {
        if (!a.isImage) {
          continue
        }
        try {
          const blob = await fetchAdminContactAttachmentBlob(msg.id, a.id)
          const url = URL.createObjectURL(blob)
          objectUrls.push(url)
          if (!alive) {
            for (const u of objectUrls) {
              URL.revokeObjectURL(u)
            }
            return
          }
          next[a.id] = url
        } catch {
          /* preview yok */
        }
      }
      if (!alive) {
        for (const u of objectUrls) {
          URL.revokeObjectURL(u)
        }
        return
      }
      setBlobUrls(next)
    })()
    return () => {
      alive = false
      for (const u of objectUrls) {
        URL.revokeObjectURL(u)
      }
    }
  }, [msg])

  async function downloadAttachment(attachmentId: string, fileName: string) {
    if (!msg) {
      return
    }
    try {
      const blob = await fetchAdminContactAttachmentBlob(msg.id, attachmentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* noop */
    }
  }

  if (error) {
    return (
      <div className="admin-page">
        <p className="admin-alert admin-alert--error">{error}</p>
        <Link className="admin-link" to="/admin/contact">
          {t('admin.backToList')}
        </Link>
      </div>
    )
  }

  if (!msg) {
    return (
      <div className="admin-page">
        <p className="admin-muted">{t('admin.loading')}</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-page__head">
        <h1 className="admin-page__title">{msg.fullName}</h1>
        <Link className="admin-btn admin-btn--ghost" to="/admin/contact">
          {t('admin.backToList')}
        </Link>
      </div>
      <div className="admin-card admin-card--flat">
        <dl className="admin-dl">
          <dt>{t('admin.email')}</dt>
          <dd>{msg.email}</dd>
          <dt>{t('admin.contact.company')}</dt>
          <dd>{msg.company || '—'}</dd>
          <dt>{t('admin.contact.received')}</dt>
          <dd>{new Date(msg.createdAtUtc).toLocaleString()}</dd>
        </dl>
        <h2 className="admin-card__title">{t('admin.contact.message')}</h2>
        <pre className="admin-pre">{msg.message}</pre>
      </div>

      {msg.attachments.length > 0 ? (
        <div className="admin-card admin-card--flat">
          <h2 className="admin-card__title">{t('admin.contact.attachments')}</h2>
          <div className="admin-attachment-grid">
            {msg.attachments.map((a) => (
              <div key={a.id} className="admin-attachment-tile">
                <div className="admin-attachment-tile__meta">
                  <span className="admin-attachment-name">{a.originalFileName}</span>
                  <span className="admin-muted">
                    {a.contentType} · {(a.sizeBytes / 1024).toFixed(1)} KB
                  </span>
                </div>
                {a.isImage && blobUrls[a.id] ? (
                  <a href={blobUrls[a.id]} target="_blank" rel="noreferrer" className="admin-attachment-preview">
                    <img src={blobUrls[a.id]} alt={a.originalFileName} />
                  </a>
                ) : null}
                <button
                  type="button"
                  className="admin-btn admin-btn--ghost admin-attachment-dl"
                  onClick={() => void downloadAttachment(a.id, a.originalFileName)}
                >
                  {t('admin.contact.download')}
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
