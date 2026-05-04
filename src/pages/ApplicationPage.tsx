import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import '@/pages/pages.css'

const MAP_EMBED_SRC =
  'https://www.openstreetmap.org/export/embed.html?bbox=29.012%2C40.972%2C29.042%2C40.998&layer=mapnik&marker=40.9855%2C29.0275'

export function ApplicationPage() {
  const { t } = useTranslation()

  return (
    <section className="page application-page">
      <h1>{t('application.title')}</h1>
      <p className="lead">{t('application.intro')}</p>
      <div className="map-frame">
        <iframe
          title={t('application.mapTitle')}
          src={MAP_EMBED_SRC}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p className="application-page__cta">
        <Link className="btn-primary" to="/contact">
          {t('application.ctaContact')}
        </Link>
      </p>
    </section>
  )
}
