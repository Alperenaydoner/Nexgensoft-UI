import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

const langs = [
  { code: 'tr', labelKey: 'lang.tr' as const },
  { code: 'en', labelKey: 'lang.en' as const },
]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()

  return (
    <label className="lang-switch" aria-label={t('aria.languageSwitcher')}>
      <Languages size={14} strokeWidth={2} />
      <select value={i18n.language.startsWith('en') ? 'en' : 'tr'} onChange={(e) => void i18n.changeLanguage(e.target.value)}>
        {langs.map(({ code, labelKey }) => (
          <option key={code} value={code}>
            {t(labelKey)}
          </option>
        ))}
      </select>
    </label>
  )
}
