import type { TFunction } from 'i18next'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import '@/pages/pages.css'

type StatItem = { value: string; label: string }

function readStats(t: TFunction): StatItem[] {
  const raw = t('home.stats', { returnObjects: true })
  if (!Array.isArray(raw)) return []
  return raw.map((row) => {
    const o = row as { value?: string; label?: string }
    return { value: String(o.value ?? ''), label: String(o.label ?? '') }
  })
}

export function HomePage() {
  const { t } = useTranslation()
  const stats = readStats(t)

  return (
    <section className="hero-premium">
      <div className="hero-premium__glow" aria-hidden="true" />
      <div className="hero-premium__inner">
        <div className="hero-badge">
          <span className="hero-badge__dot" aria-hidden="true" />
          <span>{t('home.badge')}</span>
        </div>
        <h1 className="hero-premium__title">
          <span className="hero-premium__title-line">
            {t('home.heroPrefix')}
            <span className="hero-premium__accent">{t('home.heroAccent')}</span>
            {t('home.heroSuffix')}
          </span>
        </h1>
        <p className="hero-premium__subtitle">{t('home.heroSubtitle')}</p>
        <div className="hero-premium__actions">
          <Link className="btn-primary" to="/services">
            {t('home.ctaExplore')}
          </Link>
          <Link className="btn-secondary" to="/contact">
            {t('home.ctaStart')}
          </Link>
        </div>
        <p className="hero-premium__precheck">
          <Link to="/contact#mesaj" className="hero-premium__precheck-link">
            {t('home.ctaPrecheck')}
          </Link>
        </p>
      </div>
      {stats.length > 0 && (
        <ul className="hero-stats" aria-label={t('home.statsAria')}>
          {stats.map((s) => (
            <li key={s.label} className="hero-stats__item">
              <span className="hero-stats__value">{s.value}</span>
              <span className="hero-stats__label">{s.label}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
