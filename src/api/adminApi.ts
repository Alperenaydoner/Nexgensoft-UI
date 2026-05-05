import { getAdminAccessToken } from '@/admin/authStorage'
import { ApiError, apiRequest, buildApiUrl, getApiRequestCredentials } from '@/api/httpClient'
import type { RequestOptions } from '@/api/httpClient'
import type { PagedResult } from '@/api/types/dotnet-contract'
import i18n from '@/i18n'

function adminAuthHeaders(): HeadersInit {
  const token = getAdminAccessToken()
  if (!token) {
    throw new ApiError('Unauthorized', 401)
  }
  return { Authorization: `Bearer ${token}` }
}

export async function adminRequest<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { headers, ...rest } = init
  return apiRequest<T>(path, {
    ...rest,
    headers: {
      ...adminAuthHeaders(),
      ...headers,
    },
  })
}

export type AdminStats = {
  userCount: number
  roleCount: number
  contactMessageCount: number
  contactAttachmentCount: number
  httpRequestLogCount: number
  siteContentBundleCount: number
  siteLocalizedStringCount: number
}

export type AdminUserListItem = {
  id: string
  email: string
  displayName: string
  isActive: boolean
  createdAtUtc: string
  roles: string[]
}

export type AdminUserDetail = AdminUserListItem & { normalizedEmail: string }

export type AdminRoleListItem = {
  id: string
  name: string
  normalizedName: string
  userCount: number
}

export type AdminContactMessageListItem = {
  id: string
  fullName: string
  email: string
  company: string | null
  createdAtUtc: string
  attachmentCount: number
}

export type AdminContactAttachment = {
  id: string
  originalFileName: string
  contentType: string
  sizeBytes: number
  isImage: boolean
}

export type AdminContactMessageDetail = {
  id: string
  fullName: string
  email: string
  company: string | null
  message: string
  createdAtUtc: string
  attachments: AdminContactAttachment[]
}

export type AdminHttpRequestLogListItem = {
  id: string
  occurredAtUtc: string
  httpMethod: string
  path: string
  statusCode: number
  durationMs: number
  success: boolean
  userEmail: string | null
  actionType: string | null
}

export type AdminHttpRequestLogDetail = AdminHttpRequestLogListItem & {
  queryString: string | null
  clientIp: string | null
  userAgent: string | null
  acceptLanguage: string | null
  referer: string | null
  correlationId: string | null
  traceId: string | null
  environmentName: string | null
  endpointController: string | null
  endpointAction: string | null
  exceptionType: string | null
  exceptionMessage: string | null
  requestBodySnippet: string | null
  actionTitle: string | null
  actionDescription: string | null
  userId: string | null
  userRoles: string | null
}

export type AdminContentLocaleRow = {
  locale: string
  hasBundle: boolean
  localizedStringCount: number
}

export type AdminContentOverview = {
  bundleCount: number
  totalLocalizedStrings: number
  locales: AdminContentLocaleRow[]
}

export async function adminPing(): Promise<{ ok: boolean; area: string }> {
  return adminRequest('/v1/admin/ping', { method: 'GET' })
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return adminRequest<AdminStats>('/v1/admin/stats', { method: 'GET' })
}

export async function fetchAdminUsers(page = 1, pageSize = 20): Promise<PagedResult<AdminUserListItem>> {
  return adminRequest<PagedResult<AdminUserListItem>>('/v1/admin/users', {
    method: 'GET',
    query: { page, pageSize },
  })
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>(`/v1/admin/users/${id}`, { method: 'GET' })
}

export async function fetchAdminRoles(page = 1, pageSize = 20): Promise<PagedResult<AdminRoleListItem>> {
  return adminRequest<PagedResult<AdminRoleListItem>>('/v1/admin/roles', {
    method: 'GET',
    query: { page, pageSize },
  })
}

export async function fetchAdminContactMessages(
  page = 1,
  pageSize = 20,
): Promise<PagedResult<AdminContactMessageListItem>> {
  return adminRequest<PagedResult<AdminContactMessageListItem>>('/v1/admin/contact/messages', {
    method: 'GET',
    query: { page, pageSize },
  })
}

export async function fetchAdminContactMessage(id: string): Promise<AdminContactMessageDetail> {
  return adminRequest<AdminContactMessageDetail>(`/v1/admin/contact/messages/${id}`, { method: 'GET' })
}

export function adminContactAttachmentUrl(messageId: string, attachmentId: string): string {
  return buildApiUrl(`/v1/admin/contact/messages/${messageId}/attachments/${attachmentId}`)
}

export async function fetchAdminContactAttachmentBlob(messageId: string, attachmentId: string): Promise<Blob> {
  const url = adminContactAttachmentUrl(messageId, attachmentId)
  const token = getAdminAccessToken()
  if (!token) {
    throw new ApiError('Unauthorized', 401)
  }
  const lang = i18n.language?.split('-')[0] ?? 'tr'
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept-Language': lang,
      Accept: '*/*',
      Authorization: `Bearer ${token}`,
    },
    credentials: getApiRequestCredentials(),
  })
  if (!res.ok) {
    throw new ApiError(res.statusText || 'Request failed', res.status)
  }
  return res.blob()
}

export type AdminLogsQuery = {
  page?: number
  pageSize?: number
  statusCode?: number
  pathContains?: string
  fromUtc?: string
  toUtc?: string
}

export async function fetchAdminLogs(q: AdminLogsQuery = {}): Promise<PagedResult<AdminHttpRequestLogListItem>> {
  const { page = 1, pageSize = 25, statusCode, pathContains, fromUtc, toUtc } = q
  return adminRequest<PagedResult<AdminHttpRequestLogListItem>>('/v1/admin/audit/logs', {
    method: 'GET',
    query: {
      page,
      pageSize,
      statusCode: statusCode === undefined ? undefined : statusCode,
      pathContains: pathContains?.trim() || undefined,
      fromUtc: fromUtc || undefined,
      toUtc: toUtc || undefined,
    },
  })
}

export async function fetchAdminLogDetail(id: string): Promise<AdminHttpRequestLogDetail> {
  return adminRequest<AdminHttpRequestLogDetail>(`/v1/admin/audit/logs/${id}`, { method: 'GET' })
}

export async function fetchAdminContentOverview(): Promise<AdminContentOverview> {
  return adminRequest<AdminContentOverview>('/v1/admin/content/overview', { method: 'GET' })
}
