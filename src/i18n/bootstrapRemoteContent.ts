import { fetchSiteContentBundle } from '@/content/loadSiteContent'
import i18n from '@/i18n'
import { mergeRemoteTranslation } from '@/i18n/mergeRemoteTranslation'

/**
 * Güncel `i18n.language` için API’den site paketini çeker ve çevirileri i18n’e uygular.
 */
export async function syncRemoteSiteContentWithLanguage(): Promise<void> {
  if (import.meta.env.VITE_USE_REMOTE_CONTENT !== 'true') {
    return
  }

  const lang = i18n.language?.split('-')[0] ?? 'tr'
  const bundle = await fetchSiteContentBundle(lang)
  if (bundle) {
    mergeRemoteTranslation(bundle)
  }
}

let languageListenerRegistered = false

/**
 * Dil değişince (Türkçe / English) tekrar servise gidip veriyi işler.
 * `main.tsx` içinde ilk `bootstrapRemoteContent` sonrası bir kez çağrılmalıdır.
 */
export function registerRemoteContentLanguageListener(): void {
  if (import.meta.env.VITE_USE_REMOTE_CONTENT !== 'true') {
    return
  }

  if (languageListenerRegistered) {
    return
  }

  languageListenerRegistered = true
  i18n.on('languageChanged', () => {
    void syncRemoteSiteContentWithLanguage()
  })
}

/** İlk yüklemede mevcut dil için uzak içerik. */
export async function bootstrapRemoteContent(): Promise<void> {
  await syncRemoteSiteContentWithLanguage()
}
