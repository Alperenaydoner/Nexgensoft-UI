import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, FileLock2, MapPinned, PencilLine, Search, SendHorizonal } from 'lucide-react'
import { toast } from 'sonner'

import {
  fetchApplicationPositions,
  getApplicationByCode,
  submitApplication,
  updateApplicationByCode,
} from '@/api/applicationApi'
import { FileDropzone } from '@/components/FileDropzone'
import { ApiError } from '@/api/httpClient'
import { Select } from '@/components/ui/Select'
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
  const [loadingCreate, setLoadingCreate] = useState(false)
  const [loadingQuery, setLoadingQuery] = useState(false)
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [loadingPositions, setLoadingPositions] = useState(false)
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [newUploadProgress, setNewUploadProgress] = useState<Record<string, number>>({})
  const [editUploadProgress, setEditUploadProgress] = useState<Record<string, number>>({})
  const [newFieldErrors, setNewFieldErrors] = useState<Record<string, string>>({})
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({})
  const [positionOptions, setPositionOptions] = useState<string[]>(['Asistan', 'Sofor', 'Yazilim Gelistirici'])
  const [newPosition, setNewPosition] = useState('Asistan')
  const [editPosition, setEditPosition] = useState('Asistan')
  const [queryCode, setQueryCode] = useState('')
  const [loadedCode, setLoadedCode] = useState('')
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCoverLetter, setEditCoverLetter] = useState('')
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
          setNewPosition((prev) => (next.includes(prev) ? prev : next[0]))
          setEditPosition((prev) => (next.includes(prev) ? prev : next[0]))
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
    const next = validateFields(fullName, email, newPosition, selected)
    setNewFieldErrors(next)
    return Object.keys(next).length === 0
  }

  function validateFields(fullName: string, email: string, selectedPosition: string, selected: File[]): Record<string, string> {
    const next: Record<string, string> = {}
    const lowerName = fullName.trim().toLowerCase()
    const localPart = email.trim().split('@')[0]?.toLowerCase() ?? ''
    const blocked = ['asd', 'qwe', 'zxc', 'test', 'deneme', 'dummy', 'example', 'abc', '1234']
    const hasNoise = (value: string) => blocked.some((item) => value.includes(item))

    if (!fullName.trim()) {
      next.fullName = t('contact.validation.required')
    } else if (fullName.trim().length < 2) {
      next.fullName = t('contact.validation.nameMin')
    } else if (fullName.trim().split(/\s+/).length < 2) {
      next.fullName = t('application.validation.fullName')
    } else if (hasNoise(lowerName)) {
      next.fullName = t('application.validation.fullNameMeaningful')
    }
    if (!email.trim()) {
      next.email = t('contact.validation.required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = t('contact.validation.emailInvalid')
    } else if (hasNoise(localPart)) {
      next.email = t('application.validation.emailMeaningful')
    }
    if (!selectedPosition.trim()) {
      next.position = t('contact.validation.required')
    }
    if (selected.length > maxFiles) {
      next.files = t('contact.validation.filesMax', { count: maxFiles })
    }
    return next
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    const fullName = String(fd.get('fullName') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const phone = String(fd.get('phone') ?? '').trim()
    const coverLetter = String(fd.get('coverLetter') ?? '').trim()

    if (!validate(fullName, email, newFiles)) {
      return
    }

    setLoadingCreate(true)
    try {
      const attachments = newFiles.length > 0
        ? await filesToBase64Attachments(newFiles, (key, progress) =>
            setNewUploadProgress((prev) => ({ ...prev, [key]: progress })),
            1,
          )
        : undefined
      const res = await submitWithRetry({
        fullName,
        email,
        phone: phone || undefined,
        position: newPosition,
        coverLetter: coverLetter || undefined,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      })
      if (!res.success) {
        toast.error(t('application.toastServerError'))
        return
      }
      const code = res.data ?? ''
      toast.success(t('application.toastSuccessWithCode', { code }))
      form.reset()
      setNewPosition(positionOptions[0] ?? 'Asistan')
      setNewFiles([])
      setNewUploadProgress({})
      setNewFieldErrors({})
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(t('application.toastRequestError'))
      } else {
        toast.error(t('application.toastNetworkError'))
      }
    } finally {
      setLoadingCreate(false)
    }
  }

  async function onQueryApplication() {
    const code = queryCode.trim()
    if (!code) {
      setEditFieldErrors({ applicationCode: t('contact.validation.required') })
      return
    }

    setLoadingQuery(true)
    try {
      const res = await getApplicationByCode(code)
      if (!res.success || !res.data) {
        toast.error(t('application.queryNotFound'))
        return
      }

      const data = res.data
      setLoadedCode(data.applicationCode)
      setQueryCode(data.applicationCode)
      setEditFullName(data.fullName)
      setEditEmail(data.email)
      setEditPhone(data.phone ?? '')
      setEditPosition(data.position)
      setEditCoverLetter(data.coverLetter ?? '')
      setEditFiles([])
      setEditUploadProgress({})
      setEditFieldErrors({})
      toast.success(t('application.querySuccess'))
    } catch {
      toast.error(t('application.queryNotFound'))
    } finally {
      setLoadingQuery(false)
    }
  }

  async function onUpdateSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const applicationCode = loadedCode.trim()
    const fullName = editFullName.trim()
    const email = editEmail.trim()
    const phone = editPhone.trim()
    const coverLetter = editCoverLetter.trim()

    const nextErrors = validateFields(fullName, email, editPosition, editFiles)
    if (!applicationCode) {
      nextErrors.applicationCode = t('contact.validation.required')
    }
    setEditFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setLoadingUpdate(true)
    try {
      const attachments = editFiles.length > 0
        ? await filesToBase64Attachments(editFiles, (key, progress) =>
            setEditUploadProgress((prev) => ({ ...prev, [key]: progress })),
            1,
          )
        : undefined

      const res = await updateApplicationByCode(applicationCode, {
        fullName,
        email,
        phone: phone || null,
        position: editPosition,
        coverLetter: coverLetter || null,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      })

      if (!res.success) {
        toast.error(t('application.editToastServerError'))
        return
      }

      toast.success(t('application.editToastSuccess', { code: applicationCode }))
      setLoadedCode('')
      setQueryCode('')
      setEditFullName('')
      setEditEmail('')
      setEditPhone('')
      setEditPosition(positionOptions[0] ?? 'Asistan')
      setEditCoverLetter('')
      setEditFiles([])
      setEditUploadProgress({})
      setEditFieldErrors({})
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(t('application.toastRequestError'))
      } else {
        toast.error(t('application.toastNetworkError'))
      }
    } finally {
      setLoadingUpdate(false)
    }
  }

  return (
    <section className="page application-page">
      <h1>{t('application.title')}</h1>
      <p className="lead">{t('application.intro')}</p>
      <div className="application-page__grid">
        <form className="form page-card application-page__panel" noValidate onSubmit={(e) => void onSubmit(e)}>
          <h2 className="about__h2 about__h2--icon">
            <SendHorizonal size={16} strokeWidth={2} />
            <span>{t('application.newTitle')}</span>
          </h2>
          <label>
            {t('contact.name')}
            <input name="fullName" aria-invalid={newFieldErrors.fullName ? true : undefined} />
            {newFieldErrors.fullName ? <span className="form-field-error">{newFieldErrors.fullName}</span> : null}
          </label>
          <label>
            {t('contact.email')}
            <input name="email" type="email" aria-invalid={newFieldErrors.email ? true : undefined} />
            {newFieldErrors.email ? <span className="form-field-error">{newFieldErrors.email}</span> : null}
          </label>
          <label>
            {t('application.phone')}
            <input name="phone" type="tel" />
          </label>
          <label>
            {t('application.position')}
            <Select
              value={newPosition}
              onChange={setNewPosition}
              disabled={loadingPositions}
              options={positionOptions.map((option) => ({
                value: option,
                label: t(`application.positions.${option}`, { defaultValue: option }),
              }))}
            />
            {newFieldErrors.position ? <span className="form-field-error">{newFieldErrors.position}</span> : null}
          </label>
          <label>
            {t('application.coverLetter')}
            <textarea name="coverLetter" rows={5} />
          </label>
          <FileDropzone
            files={newFiles}
            onFilesChange={setNewFiles}
            accept={allowedExt}
            maxFiles={maxFiles}
            disabled={loadingCreate}
            progressByFile={newUploadProgress}
            title={t('application.cvFiles')}
            hint={t('application.dropzoneHint')}
          />
          {newFieldErrors.files ? <span className="form-field-error">{newFieldErrors.files}</span> : null}
          <button type="submit" className="application-page__submit-btn" disabled={loadingCreate}>
            {loadingCreate ? t('application.sending') : t('application.send')}
            {!loadingCreate ? <SendHorizonal size={15} strokeWidth={2} /> : null}
          </button>
        </form>

        <form className="form page-card application-page__panel" noValidate onSubmit={(e) => void onUpdateSubmit(e)}>
          <h2 className="about__h2 about__h2--icon">
            <PencilLine size={16} strokeWidth={2} />
            <span>{t('application.editTitle')}</span>
          </h2>
          <div className="application-page__query-row">
            <label className="application-page__query-label">
              {t('application.applicationCode')}
              <input
                name="applicationCode"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                aria-invalid={editFieldErrors.applicationCode ? true : undefined}
              />
            </label>
            <button type="button" onClick={() => void onQueryApplication()} disabled={loadingQuery}>
              {loadingQuery ? t('application.querying') : t('application.query')}
              {!loadingQuery ? <Search size={15} strokeWidth={2} /> : null}
            </button>
          </div>
          {editFieldErrors.applicationCode ? (
            <span className="form-field-error">{editFieldErrors.applicationCode}</span>
          ) : null}
          <p className="application-page__edit-note">
            <FileLock2 size={14} strokeWidth={2} />
            <span>{t('application.editAttachmentPrivacy')}</span>
          </p>
          <label>
            {t('contact.name')}
            <input
              name="fullName"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              aria-invalid={editFieldErrors.fullName ? true : undefined}
              disabled={!loadedCode}
            />
            {editFieldErrors.fullName ? <span className="form-field-error">{editFieldErrors.fullName}</span> : null}
          </label>
          <label>
            {t('contact.email')}
            <input
              name="email"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              aria-invalid={editFieldErrors.email ? true : undefined}
              disabled={!loadedCode}
            />
            {editFieldErrors.email ? <span className="form-field-error">{editFieldErrors.email}</span> : null}
          </label>
          <label>
            {t('application.phone')}
            <input
              name="phone"
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              disabled={!loadedCode}
            />
          </label>
          <label>
            {t('application.position')}
            <Select
              value={editPosition}
              onChange={setEditPosition}
              disabled={loadingPositions || !loadedCode}
              options={positionOptions.map((option) => ({
                value: option,
                label: t(`application.positions.${option}`, { defaultValue: option }),
              }))}
            />
            {editFieldErrors.position ? <span className="form-field-error">{editFieldErrors.position}</span> : null}
          </label>
          <label>
            {t('application.coverLetter')}
            <textarea
              name="coverLetter"
              rows={5}
              value={editCoverLetter}
              onChange={(e) => setEditCoverLetter(e.target.value)}
              disabled={!loadedCode}
            />
          </label>
          <FileDropzone
            files={editFiles}
            onFilesChange={setEditFiles}
            accept={allowedExt}
            maxFiles={maxFiles}
            disabled={loadingUpdate || !loadedCode}
            progressByFile={editUploadProgress}
            title={t('application.editFiles')}
            hint={t('application.editDropzoneHint')}
          />
          {editFieldErrors.files ? <span className="form-field-error">{editFieldErrors.files}</span> : null}
          <button type="submit" className="application-page__submit-btn" disabled={loadingUpdate || !loadedCode}>
            {loadingUpdate ? t('application.editSending') : t('application.editSend')}
            {!loadingUpdate ? <PencilLine size={15} strokeWidth={2} /> : null}
          </button>
        </form>
      </div>
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
