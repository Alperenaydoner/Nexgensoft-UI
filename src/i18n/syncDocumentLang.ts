/** Tarayıcı `html[lang]` ile yerel doğrulama dilini uygulama diline yaklaştırır. */
export function syncDocumentLang(i18nLanguage: string): void {
  const code = i18nLanguage?.split('-')[0]?.toLowerCase() ?? 'tr'
  document.documentElement.lang = code === 'en' ? 'en' : 'tr'
}
