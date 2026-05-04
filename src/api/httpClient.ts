import i18n from '@/i18n'
import type { ApiResult, ProblemDetails } from '@/api/types/dotnet-contract'

/**
 * Göreli `/api` veya mutlak CoreService kökü (`https://localhost:7001`).
 * Kod yolları `/v1/...` olduğundan mutlak kökte yalnızca origin varsa `/api` eklenir → `…/api/v1/...`
 */
function normalizeApiBase(raw: string | undefined): string {
  const fallback = '/api'
  const t = raw?.trim()
  if (!t) return fallback

  const b = t.replace(/\/+$/, '') || fallback
  if (!/^https?:\/\//i.test(b)) {
    return b.startsWith('/') ? b : `/${b}`
  }

  try {
    const u = new URL(b)
    const pathOnly = (u.pathname || '/').replace(/\/+$/, '') || '/'
    if (pathOnly === '/') {
      return `${u.origin}/api`
    }
  } catch {
    /* geçersiz mutlak URL — olduğu gibi */
  }

  return b
}

const defaultBase = normalizeApiBase(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')

/** Çapraz kökende `include` + sunucuda AllowCredentials eksikse CORS kırılır; API çerez kullanmıyorsa `omit` yeterli. */
function requestCredentials(): RequestCredentials {
  if (typeof window === 'undefined') return 'omit'
  if (!defaultBase.startsWith('http')) return 'include'
  try {
    const apiOrigin = new URL(defaultBase).origin
    return apiOrigin === window.location.origin ? 'include' : 'omit'
  } catch {
    return 'omit'
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly problem?: ProblemDetails,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestOptions extends RequestInit {
  jsonBody?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const segment = path.startsWith('/') ? path : `/${path}`
  const merged = `${defaultBase}${segment}`
  const url = merged.startsWith('http')
    ? new URL(merged)
    : new URL(merged, window.location.origin)

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue
      url.searchParams.set(k, String(v))
    }
  }

  return merged.startsWith('http') ? url.href : `${url.pathname}${url.search}`
}

function localeHeaders(): HeadersInit {
  const lang = i18n.language?.split('-')[0] ?? 'tr'
  return {
    'Accept-Language': lang,
    Accept: 'application/json',
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { jsonBody, query, headers, body, ...rest } = options
  const url = buildUrl(path, query)

  const init: RequestInit = {
    credentials: requestCredentials(),
    headers: {
      ...localeHeaders(),
      ...(jsonBody !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    ...rest,
    body: jsonBody !== undefined ? JSON.stringify(jsonBody) : body,
  }

  const res = await fetch(url, init)

  const contentType = res.headers.get('content-type') ?? ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    const problem = isJson && payload && typeof payload === 'object' ? (payload as ProblemDetails) : undefined
    const msg =
      problem?.title ?? problem?.detail ?? (typeof payload === 'string' ? payload : res.statusText)
    throw new ApiError(msg || 'Request failed', res.status, problem)
  }

  return payload as T
}

export async function apiResult<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
  return apiRequest<ApiResult<T>>(path, options)
}
