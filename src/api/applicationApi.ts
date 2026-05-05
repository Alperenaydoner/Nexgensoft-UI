import { apiResult } from '@/api/httpClient'
import type { ApiResult, ApplicationPositionOption, ApplicationSubmitRequest } from '@/api/types/dotnet-contract'

export async function fetchApplicationPositions(): Promise<ApplicationPositionOption[]> {
  const res = await apiResult<string[]>('/v1/application/positions', {
    method: 'GET',
  })
  return (res.data ?? []).map((value) => ({ value }))
}

export async function submitApplication(body: ApplicationSubmitRequest): Promise<ApiResult<string>> {
  return apiResult<string>('/v1/application', {
    method: 'POST',
    jsonBody: body,
  })
}
