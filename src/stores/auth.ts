import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginParams, UserInfo } from '@/types/auth'
import * as authApi from '@/api/auth'
import {
  clearAuthStorage,
  getExpiresAt,
  getStoredUser,
  getToken,
  isTokenValid,
  setExpiresAt,
  setStoredUser,
  setToken,
} from '@/utils/auth-storage'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getToken())
  const expiresAt = ref<number | null>(getExpiresAt())
  const user = ref<UserInfo | null>(getStoredUser())
  // 动态路由是否已按当前登录态注入完成（刷新页面后会重置为 false）
  const routesLoaded = ref(false)

  const permissions = computed(() => user.value?.permissions ?? [])
  const roles = computed(() => user.value?.roles ?? [])

  function hasPermission(code: string): boolean {
    return permissions.value.includes(code)
  }

  function setAuthData(data: { token: string; expiresAtEpochSecond: number; user: UserInfo }) {
    token.value = data.token
    expiresAt.value = data.expiresAtEpochSecond
    user.value = data.user
    setToken(data.token)
    setExpiresAt(data.expiresAtEpochSecond)
    setStoredUser(data.user)
  }

  async function login(params: LoginParams) {
    const result = await authApi.login(params)
    setAuthData(result)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      reset()
    }
  }

  function reset() {
    token.value = null
    expiresAt.value = null
    user.value = null
    routesLoaded.value = false
    clearAuthStorage()
  }

  function isLoggedIn(): boolean {
    return isTokenValid()
  }

  return {
    token,
    user,
    permissions,
    roles,
    routesLoaded,
    hasPermission,
    login,
    logout,
    reset,
    isLoggedIn,
  }
})
