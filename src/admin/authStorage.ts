const STORAGE_KEY = 'nexgensoft_admin_access_token'
const REMEMBER_EMAIL_KEY = 'nexgensoft_admin_remember_email'
const REMEMBER_ME_KEY = 'nexgensoft_admin_remember_me'

export function getAdminAccessToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
}

export function setAdminAccessToken(token: string | null, rememberMe = true): void {
  if (typeof window === 'undefined') {
    return
  }
  if (token) {
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, token)
      sessionStorage.removeItem(STORAGE_KEY)
    } else {
      sessionStorage.setItem(STORAGE_KEY, token)
      localStorage.removeItem(STORAGE_KEY)
    }
  } else {
    localStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function setAdminLoginRememberPreference(email: string, rememberMe: boolean): void {
  if (typeof window === 'undefined') {
    return
  }
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, '1')
    localStorage.setItem(REMEMBER_EMAIL_KEY, email)
  } else {
    localStorage.setItem(REMEMBER_ME_KEY, '0')
    localStorage.removeItem(REMEMBER_EMAIL_KEY)
  }
}

export function getAdminLoginRememberPreference(): { rememberMe: boolean; email: string } {
  if (typeof window === 'undefined') {
    return { rememberMe: true, email: '' }
  }
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) !== '0'
  const email = localStorage.getItem(REMEMBER_EMAIL_KEY) ?? ''
  return { rememberMe, email }
}
