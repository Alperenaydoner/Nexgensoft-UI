import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { Select } from '@/components/ui/Select'

const langs = [
  { code: 'tr', labelKey: 'lang.tr' as const },
  { code: 'en', labelKey: 'lang.en' as const },
]

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('en') ? 'en' : 'tr'

  return (
    <label className="lang-switch" aria-label={t('aria.languageSwitcher')}>
      <Languages size={14} strokeWidth={2} />
      <Select
        value={current}
        onChange={(next) => void i18n.changeLanguage(next)}
        options={langs.map(({ code, labelKey }) => ({ value: code, label: t(labelKey) }))}
        ariaLabel={t('aria.languageSwitcher')}
      />
    </label>
  )
}
