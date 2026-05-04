import type { SiteContentBundle } from '@/api/types/dotnet-contract'
import i18n from '@/i18n'

/**
 * API'den gelen `translation` nesnesini mevcut i18n kaynaklarının üzerine yazar (uzaktan içerik).
 */
export function mergeRemoteTranslation(bundle: SiteContentBundle): void {
  const lang = bundle.locale?.split('-')[0] ?? 'tr'
  const root = bundle.translation
  if (!root || typeof root !== 'object' || Object.keys(root).length === 0) {
    return
  }

  void i18n.addResourceBundle(lang, 'translation', root as Record<string, unknown>, true, true)
}
