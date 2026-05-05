const STORAGE_KEY = 'nexgensoft_admin_access_token'

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(STORAGE_KEY)
}

export function setAdminAccessToken(token: string | null): void {
  if (typeof window === 'undefined') {
    return
  }
  if (token) {
    localStorage.setItem(STORAGE_KEY, token)
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}
