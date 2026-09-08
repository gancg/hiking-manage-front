// 修改当前登录用户密码的请求参数
export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: number
  username: string
  displayName: string
  status: string
  roles: string[]
  permissions: string[]
}

export interface LoginResult {
  token: string
  tokenType: string
  expiresAtEpochSecond: number
  user: UserInfo
}
