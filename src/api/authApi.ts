import { apiRequest } from '@/api/httpClient'

export type CurrentUserDto = {
  id: string
  email: string
  displayName: string
  roles: string[]
}

export type LoginResponse = {
  accessToken: string
  expiresAtUtc: string
  user: CurrentUserDto
}

export async function loginAdmin(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    jsonBody: { email, password },
  })
}

export async function fetchCurrentUser(accessToken: string): Promise<CurrentUserDto> {
  return apiRequest<CurrentUserDto>('/v1/auth/me', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}
