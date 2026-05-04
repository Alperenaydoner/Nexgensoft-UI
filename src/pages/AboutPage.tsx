import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

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
      {paras.map((p, i) => (
        <p key={i} className="about__p">
          {p}
        </p>
      ))}
      <h2 className="about__h2">{t('about.howTitle')}</h2>
      <ol className="about__list">
        {how.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <p className="about__goal">{t('about.goal')}</p>
      <h2 className="about__h2">{t('about.whyTitle')}</h2>
      <ul className="about__list about__list--bullet">
        {why.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <h2 className="about__h2">{t('about.visionTitle')}</h2>
      <p className="about__vision">{t('about.visionBody')}</p>
    </article>
  )
}
