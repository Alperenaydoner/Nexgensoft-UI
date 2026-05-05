import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, MapPinned, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'

import { fetchApplicationPositions, submitApplication } from '@/api/applicationApi'
import { FileDropzone } from '@/components/FileDropzone'
import { ApiError } from '@/api/httpClient'
import { filesToBase64Attachments } from '@/utils/filesToBase64Attachments'

import '@/pages/pages.css'

const OSM_MAP_EMBED_SRC =
  'https://www.openstreetmap.org/export/embed.html?bbox=29.012%2C40.972%2C29.042%2C40.998&layer=mapnik&marker=40.9855%2C29.0275'
const MAPBOX_STYLE_ID = import.meta.env.VITE_MAPBOX_STYLE_ID ?? 'dark-v11'
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN
const MAPBOX_MAP_EMBED_SRC = MAPBOX_TOKEN
  ? `https://api.mapbox.com/styles/v1/mapbox/${MAPBOX_STYLE_ID}.html?title=false&zoomwheel=false&access_token=${MAPBOX_TOKEN}#12/40.9855/29.0275`
  : null

export function ApplicationPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [positionOptions, setPositionOptions] = useState<string[]>(['Asistan', 'Sofor', 'Yazilim Gelistirici'])
  const [position, setPosition] = useState('Asistan')
  const maxFiles = 10
  const maxSubmitRetries = 1
  const allowedExt = useMemo(() => '.pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.xls,.xlsx,.txt,.zip', [])

  useEffect(() => {
    let cancelled = false
    setLoadingPositions(true)
    void fetchApplicationPositions()
      .then((items) => {
        if (cancelled) {
          return
        }
        const next = items.map((x) => x.value).filter(Boolean)
        if (next.length > 0) {
          setPositionOptions(next)
          setPosition((prev) => (next.includes(prev) ? prev : next[0]))
        }
      })
      .catch(() => {
        // Keep fallback options to avoid blocking form.
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPositions(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const mapEmbedSrc = MAPBOX_MAP_EMBED_SRC ?? OSM_MAP_EMBED_SRC
  const mapClassName = MAPBOX_MAP_EMBED_SRC ? 'map-frame map-frame--provider' : 'map-frame map-frame--dark'

  async function submitWithRetry(payload: {
    fullName: string
    email: string
    phone?: string
    position: string
    coverLetter?: string
    attachments?: Awaited<ReturnType<typeof filesToBase64Attachments>>
  }) {
    let attempt = 0
    while (true) {
      try {
        return await submitApplication(payload)
      } catch (err) {
        const shouldRetry = !(err instanceof ApiError) || err.status >= 500
        if (!shouldRetry || attempt >= maxSubmitRetries) {
          throw err
        }
        attempt += 1
      }
    }
  }

  function validate(fullName: string, email: string, selected: File[]): boolean {
    const next: Record<string, string> = {}
    if (!fullName.trim()) {
      next.fullName = t('contact.validation.required')
    } else if (fullName.trim().length < 2) {
      next.fullName = t('contact.validation.nameMin')
    }
    if (!email.trim()) {
      next.email = t('contact.validation.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t('contact.validation.emailInvalid')
    }
    if (!position.trim()) {
      next.position = t('contact.validation.required')
    }
    if (selected.length > maxFiles) {
      next.files = t('contact.validation.filesMax', { count: maxFiles })
    }
    setFieldErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const fullName = String(fd.get('fullName') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const phone = String(fd.get('phone') ?? '').trim()
    const coverLetter = String(fd.get('coverLetter') ?? '').trim()

    if (!validate(fullName, email, files)) {
      return
    }

    setLoading(true)
    try {
      const attachments = files.length > 0
        ? await filesToBase64Attachments(files, (key, progress) =>
            setUploadProgress((prev) => ({ ...prev, [key]: progress })),
            1,
          )
        : undefined
      const res = await submitWithRetry({
        fullName,
        email,
        phone: phone || undefined,
        position,
        coverLetter: coverLetter || undefined,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      })
      if (!res.success) {
        toast.error(t('application.toastServerError'))
        return
      }
      toast.success(t('application.toastSuccess'))
      form.reset()
      setPosition(positionOptions[0] ?? 'Asistan')
      setFiles([])
      setUploadProgress({})
      setFieldErrors({})
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(t('application.toastRequestError'))
      } else {
        toast.error(t('application.toastNetworkError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page application-page">
      <h1>{t('application.title')}</h1>
      <p className="lead">{t('application.intro')}</p>
      <form className="form page-card" noValidate onSubmit={(e) => void onSubmit(e)}>
        <label>
          {t('contact.name')}
          <input name="fullName" aria-invalid={fieldErrors.fullName ? true : undefined} />
          {fieldErrors.fullName ? <span className="form-field-error">{fieldErrors.fullName}</span> : null}
        </label>
        <label>
          {t('contact.email')}
          <input name="email" type="email" aria-invalid={fieldErrors.email ? true : undefined} />
          {fieldErrors.email ? <span className="form-field-error">{fieldErrors.email}</span> : null}
        </label>
        <label>
          {t('application.phone')}
          <input name="phone" type="tel" />
        </label>
        <label>
          {t('application.position')}
          <select value={position} onChange={(e) => setPosition(e.target.value)} disabled={loadingPositions}>
            {positionOptions.map((option) => (
              <option key={option} value={option}>
                {t(`application.positions.${option}`, { defaultValue: option })}
              </option>
            ))}
          </select>
          {fieldErrors.position ? <span className="form-field-error">{fieldErrors.position}</span> : null}
        </label>
        <label>
          {t('application.coverLetter')}
          <textarea name="coverLetter" rows={5} />
        </label>
        <FileDropzone
          files={files}
          onFilesChange={setFiles}
          accept={allowedExt}
          maxFiles={maxFiles}
          disabled={loading}
          progressByFile={uploadProgress}
          title={t('application.cvFiles')}
          hint={t('application.dropzoneHint')}
        />
        {fieldErrors.files ? <span className="form-field-error">{fieldErrors.files}</span> : null}
        <button type="submit" className="application-page__submit-btn" disabled={loading}>
          {loading ? t('application.sending') : t('application.send')}
          {!loading ? <SendHorizonal size={15} strokeWidth={2} /> : null}
        </button>
      </form>
      <div className="page-card application-page__map-card">
        <h2 className="about__h2 about__h2--icon">
          <MapPinned size={16} strokeWidth={2} />
          <span>{t('application.mapTitle')}</span>
        </h2>
        <div className={mapClassName}>
        <iframe
          title={t('application.mapTitle')}
          src={mapEmbedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        </div>
      </div>
      <p className="application-page__cta">
        <Link className="btn-primary" to="/contact">
          {t('application.ctaContact')}
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      </p>
    </section>
  )
}
