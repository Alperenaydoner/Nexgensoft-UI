import type { SiteContentBundle } from '@/api/types/dotnet-contract'
import { apiRequest } from '@/api/httpClient'

/**
 * Uzak içerik açıkken .NET’ten tam site kopyası çeker.
 * Kapalıyken `null` döner; UI i18n JSON’dan okumaya devam eder.
 */
export async function fetchSiteContentBundle(locale: string): Promise<SiteContentBundle | null> {
  if (import.meta.env.VITE_USE_REMOTE_CONTENT !== 'true') return null
  return apiRequest<SiteContentBundle>(`/v1/content/site`, {
    method: 'GET',
    query: { locale },
  })
}
