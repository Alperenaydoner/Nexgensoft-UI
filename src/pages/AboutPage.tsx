import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Eye, Target, Waypoints } from 'lucide-react'

import '@/pages/pages.css'

function readStringArray(t: TFunction, key: string): string[] {
  const raw = t(key, { returnObjects: true })
  if (!Array.isArray(raw)) return []
  return raw.map((x) => String(x))
}

export function AboutPage() {
  const { t } = useTranslation()
  const paras = readStringArray(t, 'about.paras')
  const how = readStringArray(t, 'about.howSteps')
  const why = readStringArray(t, 'about.whySteps')

  return (
    <article className="page about">
      <h1 className="about__headline">{t('about.headline')}</h1>
      <section className="page-card">
        {paras.map((p, i) => (
          <p key={i} className="about__p">
            {p}
          </p>
        ))}
      </section>
      <section className="page-card">
        <h2 className="about__h2 about__h2--icon">
          <Waypoints size={16} strokeWidth={2} />
          <span>{t('about.howTitle')}</span>
        </h2>
        <ol className="about__list">
          {how.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="about__goal">
          <Target size={16} strokeWidth={2} />
          <span>{t('about.goal')}</span>
        </p>
      </section>
      <section className="page-card">
        <h2 className="about__h2 about__h2--icon">
          <Eye size={16} strokeWidth={2} />
          <span>{t('about.whyTitle')}</span>
        </h2>
        <ul className="about__list about__list--bullet">
          {why.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <h2 className="about__h2">{t('about.visionTitle')}</h2>
        <p className="about__vision">{t('about.visionBody')}</p>
      </section>
    </article>
  )
}
