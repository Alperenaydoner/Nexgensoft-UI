import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { BriefcaseBusiness, Send } from 'lucide-react'

import { ApiError } from '@/api/httpClient'
import { submitContact } from '@/api/contactApi'
import { Select } from '@/components/ui/Select'

import '@/pages/pages.css'

export function ContactPage() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [inquiryType, setInquiryType] = useState('general')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  function validate(
    fullName: string,
    email: string,
    message: string,
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

    if (!validate(fullName, email, message)) {
      return
    }

    setLoading(true)
    try {
      const res = await submitContact({
        fullName,
        email,
        company,
        message: `[${inquiryType}] ${message}`,
      })
      if (!res.success) {
        toast.error(t('contact.toastServerError'))
        return
      }
      toast.success(t('contact.toastSuccess'))
      form.reset()
      setInquiryType('general')
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
      <form className="form page-card" noValidate onSubmit={(e) => void onSubmit(e)}>
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
          {t('contact.inquiryType')}
          <Select
            value={inquiryType}
            onChange={setInquiryType}
            options={[
              { value: 'general', label: t('contact.inquiryTypes.general') },
              { value: 'partnership', label: t('contact.inquiryTypes.partnership') },
              { value: 'support', label: t('contact.inquiryTypes.support') },
              { value: 'sales', label: t('contact.inquiryTypes.sales') },
            ]}
          />
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
        <button type="submit" disabled={loading}>
          <Send size={14} strokeWidth={2} />
          {loading ? t('contact.sending') : t('contact.send')}
        </button>
      </form>
      <p className="contact-work-link contact-work-link--icon">
        <BriefcaseBusiness size={14} strokeWidth={2} />
        <Link to="/basvuru">{t('contact.applicationLink')}</Link>
      </p>
    </section>
  )
}
