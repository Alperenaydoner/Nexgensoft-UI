import { apiResult } from '@/api/httpClient'
import type {
  ApiResult,
  ApplicationByCodeResponse,
  ApplicationPositionOption,
  ApplicationSubmitRequest,
  ApplicationUpdateByCodeRequest,
} from '@/api/types/dotnet-contract'

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

export async function updateApplicationByCode(
  applicationCode: string,
  body: ApplicationUpdateByCodeRequest,
): Promise<ApiResult<string>> {
  return apiResult<string>(`/v1/application/${encodeURIComponent(applicationCode)}`, {
    method: 'PUT',
    jsonBody: body,
  })
}

export async function getApplicationByCode(applicationCode: string): Promise<ApiResult<ApplicationByCodeResponse>> {
  return apiResult<ApplicationByCodeResponse>(`/v1/application/${encodeURIComponent(applicationCode)}`, {
    method: 'GET',
  })
}
