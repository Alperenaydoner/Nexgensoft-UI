import { FormEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ApiError } from '@/api/httpClient'
import { submitContact } from '@/api/contactApi'
import { filesToBase64Attachments } from '@/utils/filesToBase64Attachments'

import '@/pages/pages.css'

const maxFiles = 10
const maxBytesPerFile = 10 * 1024 * 1024
const allowedExt = new Set([
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.gif',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.txt',
  '.zip',
])

function extensionOf(name: string): string {
  const i = name.lastIndexOf('.')
  return i >= 0 ? name.slice(i).toLowerCase() : ''
}

export function ContactPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const acceptAttr = useMemo(
    () => Array.from(allowedExt).filter((e) => e.length > 0).join(','),
    [],
  )

  function validate(
    fullName: string,
    email: string,
    message: string,
    selected: File[],
  ): boolean {
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
    if (!message.trim()) {
      next.message = t('contact.validation.required')
    } else if (message.trim().length < 10) {
      next.message = t('contact.validation.messageMin')
    }
    if (selected.length > maxFiles) {
      next.files = t('contact.validation.filesMax', { count: maxFiles })
    }
    for (const f of selected) {
      if (f.size > maxBytesPerFile) {
        next.files = t('contact.validation.fileTooBig')
        break
      }
      const ext = extensionOf(f.name)
      if (!ext || !allowedExt.has(ext)) {
        next.files = t('contact.validation.fileType')
        break
      }
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
    const company = String(fd.get('company') ?? '').trim() || null
    const message = String(fd.get('message') ?? '').trim()

    if (!validate(fullName, email, message, files)) {
      return
    }

    setLoading(true)
    try {
      const attachments = files.length > 0 ? await filesToBase64Attachments(files) : undefined
      const res = await submitContact({
        fullName,
        email,
        company,
        message,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      })
      if (!res.success) {
        toast.error(t('contact.toastServerError'))
        return
      }
      toast.success(t('contact.toastSuccess'))
      form.reset()
      setFiles([])
      setFieldErrors({})
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(t('contact.toastRequestError'))
      } else {
        toast.error(t('contact.toastNetworkError'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="page" id="mesaj">
      <h1>{t('contact.pageTitle')}</h1>
      <p className="lead">{t('contact.pageIntro')}</p>
      <p className="contact-hint">{t('contact.precheckHint')}</p>
      <p className="contact-work-link">
        <Link to="/basvuru">{t('contact.applicationLink')}</Link>
      </p>
      <form className="form" noValidate onSubmit={(e) => void onSubmit(e)}>
        <label>
          {t('contact.name')}
          <input
            name="fullName"
            autoComplete="name"
            aria-invalid={fieldErrors.fullName ? true : undefined}
            aria-describedby={fieldErrors.fullName ? 'err-fullName' : undefined}
          />
          {fieldErrors.fullName ? (
            <span id="err-fullName" className="form-field-error" role="alert">
              {fieldErrors.fullName}
            </span>
          ) : null}
        </label>
        <label>
          {t('contact.email')}
          <input
            name="email"
            type="email"
            autoComplete="email"
            aria-invalid={fieldErrors.email ? true : undefined}
            aria-describedby={fieldErrors.email ? 'err-email' : undefined}
          />
          {fieldErrors.email ? (
            <span id="err-email" className="form-field-error" role="alert">
              {fieldErrors.email}
            </span>
          ) : null}
        </label>
        <label>
          {t('contact.company')}
          <input name="company" autoComplete="organization" />
        </label>
        <label>
          {t('contact.message')}
          <textarea
            name="message"
            rows={5}
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby={fieldErrors.message ? 'err-message' : undefined}
          />
          {fieldErrors.message ? (
            <span id="err-message" className="form-field-error" role="alert">
              {fieldErrors.message}
            </span>
          ) : null}
        </label>
        <label>
          {t('contact.filesLabel')}
          <input
            type="file"
            multiple
            accept={acceptAttr}
            aria-invalid={fieldErrors.files ? true : undefined}
            aria-describedby={fieldErrors.files ? 'err-files' : undefined}
            onChange={(ev) => {
              const list = Array.from(ev.target.files ?? [])
              setFiles(list)
              setFieldErrors((prev) => {
                if (!('files' in prev)) {
                  return prev
                }
                const next = { ...prev }
                delete next.files
                return next
              })
            }}
          />
          <span className="contact-files-hint">{t('contact.filesHint', { max: maxFiles })}</span>
          {fieldErrors.files ? (
            <span id="err-files" className="form-field-error" role="alert">
              {fieldErrors.files}
            </span>
          ) : null}
        </label>
        <button type="submit" disabled={loading}>
          {loading ? t('contact.sending') : t('contact.send')}
        </button>
      </form>
    </section>
  )
}
