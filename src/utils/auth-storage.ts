import type { UserInfo } from '@/types/auth'

const TOKEN_KEY = 'hm_token'
const EXPIRES_KEY = 'hm_token_expires_at'
const USER_KEY = 'hm_user'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getExpiresAt(): number | null {
  const raw = localStorage.getItem(EXPIRES_KEY)
  return raw ? Number(raw) : null
}

export function setExpiresAt(expiresAtEpochSecond: number) {
  localStorage.setItem(EXPIRES_KEY, String(expiresAtEpochSecond))
}

export function getStoredUser(): UserInfo | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as UserInfo) : null
}

export function setStoredUser(user: UserInfo) {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// token 与过期时间需同时存在且未过期
export function isTokenValid(): boolean {
  const token = getToken()
  const expiresAt = getExpiresAt()
  if (!token || !expiresAt) return false
  return Date.now() < expiresAt * 1000
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EXPIRES_KEY)
  localStorage.removeItem(USER_KEY)
}
