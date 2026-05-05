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
  jobApplicationCount: number
  jobApplicationAttachmentCount: number
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
export type AdminUserUpsertInput = {
  email: string
  displayName: string
  isActive: boolean
  password?: string
  roles: string[]
}

export type AdminRoleListItem = {
  id: string
  name: string
  normalizedName: string
  userCount: number
}
export type AdminRoleUpsertInput = { name: string }

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

export type AdminContentItem = { key: string; value: string }
export type AdminContentLocaleDetail = {
  locale: string
  items: AdminContentItem[]
}
export type AdminContentAuditRow = {
  id: string
  occurredAtUtc: string
  path: string
  statusCode: number
  userEmail: string | null
  actionTitle: string | null
}

export type AdminJobApplicationListItem = {
  id: string
  fullName: string
  email: string
  phone: string | null
  position: string
  createdAtUtc: string
  attachmentCount: number
}

export type AdminJobApplicationAttachment = {
  id: string
  originalFileName: string
  contentType: string
  sizeBytes: number
  isImage: boolean
}

export type AdminJobApplicationDetail = {
  id: string
  fullName: string
  email: string
  phone: string | null
  position: string
  coverLetter: string | null
  createdAtUtc: string
  attachments: AdminJobApplicationAttachment[]
}

export async function adminPing(): Promise<{ ok: boolean; area: string }> {
  return adminRequest('/v1/admin/ping', { method: 'GET' })
}

export async function fetchAdminStats(): Promise<AdminStats> {
  return adminRequest<AdminStats>('/v1/admin/stats', { method: 'GET' })
}

export type AdminUsersQuery = {
  page?: number
  pageSize?: number
  query?: string
  isActive?: boolean
  role?: string
  sortBy?: 'createdAtUtc' | 'email' | 'displayName' | 'active'
  sortDir?: 'asc' | 'desc'
}
export async function fetchAdminUsers(q: AdminUsersQuery = {}): Promise<PagedResult<AdminUserListItem>> {
  const {
    page = 1,
    pageSize = 20,
    query,
    isActive,
    role,
    sortBy = 'createdAtUtc',
    sortDir = 'desc',
  } = q
  return adminRequest<PagedResult<AdminUserListItem>>('/v1/admin/users', {
    method: 'GET',
    query: { page, pageSize, query, isActive, role, sortBy, sortDir },
  })
}

export async function fetchAdminUser(id: string): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>(`/v1/admin/users/${id}`, { method: 'GET' })
}

export async function fetchAdminRoles(page = 1, pageSize = 20): Promise<PagedResult<AdminRoleListItem>> {
  return fetchAdminRolesWithQuery({ page, pageSize })
}
export type AdminRolesQuery = {
  page?: number
  pageSize?: number
  query?: string
  sortBy?: 'name' | 'normalizedName' | 'users'
  sortDir?: 'asc' | 'desc'
}
export async function fetchAdminRolesWithQuery(q: AdminRolesQuery = {}): Promise<PagedResult<AdminRoleListItem>> {
  const { page = 1, pageSize = 20, query, sortBy = 'name', sortDir = 'asc' } = q
  return adminRequest<PagedResult<AdminRoleListItem>>('/v1/admin/roles', {
    method: 'GET',
    query: { page, pageSize, query, sortBy, sortDir },
  })
}

export async function fetchAdminRoleOptions(): Promise<{ items: string[] }> {
  return adminRequest<{ items: string[] }>('/v1/admin/roles/options', { method: 'GET' })
}

export async function createAdminUser(input: AdminUserUpsertInput): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>('/v1/admin/users', { method: 'POST', jsonBody: input })
}

export async function updateAdminUser(id: string, input: AdminUserUpsertInput): Promise<AdminUserDetail> {
  return adminRequest<AdminUserDetail>(`/v1/admin/users/${id}`, { method: 'PUT', jsonBody: input })
}

export async function deleteAdminUser(id: string): Promise<void> {
  await adminRequest(`/v1/admin/users/${id}`, { method: 'DELETE' })
}

export async function bulkDeleteAdminUsers(ids: string[]): Promise<{ deletedCount: number }> {
  return adminRequest<{ deletedCount: number }>('/v1/admin/users/bulk-delete', {
    method: 'POST',
    jsonBody: { ids },
  })
}

export async function createAdminRole(input: AdminRoleUpsertInput): Promise<AdminRoleListItem> {
  return adminRequest<AdminRoleListItem>('/v1/admin/roles', { method: 'POST', jsonBody: input })
}

export async function updateAdminRole(id: string, input: AdminRoleUpsertInput): Promise<AdminRoleListItem> {
  return adminRequest<AdminRoleListItem>(`/v1/admin/roles/${id}`, { method: 'PUT', jsonBody: input })
}

export async function deleteAdminRole(id: string): Promise<void> {
  await adminRequest(`/v1/admin/roles/${id}`, { method: 'DELETE' })
}

export async function fetchAdminContactMessages(
  page = 1,
  pageSize = 20,
  query?: string,
  hasAttachments?: boolean,
  fromUtc?: string,
  toUtc?: string,
  sortBy: 'createdAtUtc' | 'fullName' | 'email' | 'attachments' = 'createdAtUtc',
  sortDir: 'asc' | 'desc' = 'desc',
): Promise<PagedResult<AdminContactMessageListItem>> {
  return adminRequest<PagedResult<AdminContactMessageListItem>>('/v1/admin/contact/messages', {
    method: 'GET',
    query: { page, pageSize, query, hasAttachments, fromUtc, toUtc, sortBy, sortDir },
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

export async function fetchAdminContentLocale(locale: string): Promise<AdminContentLocaleDetail> {
  return adminRequest<AdminContentLocaleDetail>(`/v1/admin/content/locales/${encodeURIComponent(locale)}`, { method: 'GET' })
}

export async function saveAdminContentLocale(locale: string, items: AdminContentItem[]): Promise<AdminContentLocaleDetail> {
  return adminRequest<AdminContentLocaleDetail>('/v1/admin/content/locales/save', {
    method: 'POST',
    jsonBody: { locale, items },
  })
}

export async function fetchAdminContentAudit(locale: string, take = 20): Promise<AdminContentAuditRow[]> {
  return adminRequest<AdminContentAuditRow[]>(
    `/v1/admin/content/locales/${encodeURIComponent(locale)}/audit`,
    { method: 'GET', query: { take } },
  )
}

export async function fetchAdminJobApplications(
  page = 1,
  pageSize = 20,
  query?: string,
  position?: string,
  hasAttachments?: boolean,
  fromUtc?: string,
  toUtc?: string,
  sortBy: 'createdAtUtc' | 'fullName' | 'email' | 'position' | 'attachments' = 'createdAtUtc',
  sortDir: 'asc' | 'desc' = 'desc',
): Promise<PagedResult<AdminJobApplicationListItem>> {
  return adminRequest<PagedResult<AdminJobApplicationListItem>>('/v1/admin/applications', {
    method: 'GET',
    query: { page, pageSize, query, position, hasAttachments, fromUtc, toUtc, sortBy, sortDir },
  })
}

export async function fetchAdminJobApplication(id: string): Promise<AdminJobApplicationDetail> {
  return adminRequest<AdminJobApplicationDetail>(`/v1/admin/applications/${id}`, { method: 'GET' })
}

export function adminJobApplicationAttachmentUrl(applicationId: string, attachmentId: string): string {
  return buildApiUrl(`/v1/admin/applications/${applicationId}/attachments/${attachmentId}`)
}

export async function fetchAdminJobApplicationAttachmentBlob(applicationId: string, attachmentId: string): Promise<Blob> {
  const url = adminJobApplicationAttachmentUrl(applicationId, attachmentId)
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
