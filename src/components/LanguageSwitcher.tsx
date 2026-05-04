import { useTranslation } from 'react-i18next'

const langs = [
  { code: 'tr', labelKey: 'lang.tr' as const },
  { code: 'en', labelKey: 'lang.en' as const },
]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  return (
    <div className="lang-switch" role="group" aria-label={t('aria.languageSwitcher')}>
      {langs.map(({ code, labelKey }) => (
        <button
          key={code}
          type="button"
          className={`lang-switch__btn${i18n.language.startsWith(code) ? ' is-active' : ''}`}
          onClick={() => void i18n.changeLanguage(code)}
        >
          {t(labelKey)}
        </button>
      ))}
    </div>
  )
}
