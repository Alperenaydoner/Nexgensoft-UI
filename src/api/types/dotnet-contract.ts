/**
 * .NET Core Web API ile hizalı TypeScript tipleri.
 * C# tarafında PascalCase JSON serileştirme varsayılır (System.Text.Json default).
 */

/** Tekil kaynak cevabı */
export interface ApiResult<T> {
  success: boolean
  data: T | null
  message: string | null
  traceId: string | null
  errors: string[] | null
}

/** Sayfalı liste (ör. PagedResult<T>) */
export interface PagedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

/** RFC 7807 Problem Details (ValidationProblemDetails dahil) */
export interface ProblemDetails {
  type?: string | null
  title?: string | null
  status?: number
  detail?: string | null
  instance?: string | null
  traceId?: string | null
  errors?: Record<string, string[]>
  [key: string]: unknown
}

/** POST /api/v1/contact — JSON; ekler Base64 (ham veya data URL). */
export interface ContactAttachmentInput {
  fileName: string
  contentType?: string | null
  base64: string
}

export interface ContactSubmitRequest {
  fullName: string
  email: string
  company?: string | null
  message: string
  attachments?: ContactAttachmentInput[] | null
}

export interface NewsletterSubscribeRequest {
  email: string
  locale?: string | null
}

/** Statik/CMS sayfa içeriği (backend’den gelecek yapı — şimdilik i18n ile doldurulur) */
export interface StaticPageBlock {
  key: string
  /** Markdown veya düz metin */
  content: string
}

export interface StaticPageDocument {
  slug: string
  locale: string
  title: string
  metaDescription?: string | null
  blocks: StaticPageBlock[]
}

export interface SiteNavigationItem {
  slug: string
  label: string
  order: number
}

/** GET /api/v1/content/site?locale=tr — yerleşim + i18next ile birleştirilecek çeviri ağacı */
export interface SiteContentBundle {
  locale: string
  navigation: SiteNavigationItem[]
  pages: Record<string, StaticPageDocument>
  /** WebSiteReact `locales/*.json` ile aynı şekilde — uzaktan gelince addResourceBundle ile merge edilir */
  translation: Record<string, unknown>
}
