import request from '@/utils/request'
import type { ChangePasswordParams, LoginParams, LoginResult, UserInfo } from '@/types/auth'

// 修改当前登录用户的密码
export function changePassword(params: ChangePasswordParams) {
  return request.post<null, null>('/auth/change-password', params)
}

export function login(params: LoginParams) {
  return request.post<LoginResult, LoginResult>('/auth/login', params)
}

export function logout() {
  return request.post<null, null>('/auth/logout')
}

export function getMe() {
  return request.get<UserInfo, UserInfo>('/auth/me')
}
