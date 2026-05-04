import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import '@/pages/pages.css'

type ServiceItem = { title: string; body: string }

function readItems(t: TFunction): ServiceItem[] {
  const raw = t('services.items', { returnObjects: true })
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const o = row as { title?: string; body?: string }
    return { title: String(o.title ?? ''), body: String(o.body ?? '') }
  })
}

export function ServicesPage() {
  const { t } = useTranslation()
  const items = readItems(t)

  return (
    <section className="page">
      <h1>{t('services.pageTitle')}</h1>
      <p className="lead">{t('services.pageIntro')}</p>
      <ul className="service-grid">
        {items.map((item) => (
          <li key={item.title} className="service-card">
            <h2 className="service-card__title">{item.title}</h2>
            <p className="service-card__body">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
