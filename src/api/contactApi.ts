import { apiResult } from '@/api/httpClient'
import type { ApiResult, ContactSubmitRequest } from '@/api/types/dotnet-contract'

/** POST /api/v1/contact — JSON; isteğe bağlı çoklu dosya (Base64). */
export async function submitContact(body: ContactSubmitRequest): Promise<ApiResult<string>> {
  return apiResult<string>('/v1/contact', {
    method: 'POST',
    jsonBody: body,
  })
}
