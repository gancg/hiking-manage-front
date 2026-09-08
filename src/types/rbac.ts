export type RbacStatus = 'active' | 'disabled'

export interface RbacUserDto {
  id: number
  username: string
  displayName: string
  email: string
  mobile: string
  status: RbacStatus
  roleCodes: string[]
}

export interface RbacUserDetailDto extends RbacUserDto {
  roleIds?: number[]
}

export interface CreateUserParams {
  username: string
  password?: string
  displayName: string
  email?: string
  mobile?: string
  roleIds: number[]
}

export interface UpdateUserParams {
  displayName: string
  email?: string
  mobile?: string
  roleIds: number[]
}

export type UserStatus = RbacStatus

export interface RoleDto {
  id: number
  code: string
  name: string
  status: RbacStatus
}

export interface RoleDetailDto extends RoleDto {
  description?: string
  permissionIds: number[]
}

export interface CreateRoleParams {
  code: string
  name: string
  description?: string
  status: RbacStatus
  permissionIds?: number[]
}

export interface UpdateRoleParams extends CreateRoleParams {}

export interface PermissionDto {
  id: number
  code: string
  name: string
  resourceType?: string
  resource: string
  action: string
  parentId?: number | null
  sortOrder?: number
  status: RbacStatus
}

export interface PermissionDetailDto extends PermissionDto {
  resourceType: string
  parentId: number | null
  sortOrder: number
}

export interface CreatePermissionParams {
  code: string
  name: string
  resourceType: string
  resource: string
  action: string
  parentId?: number | null
  sortOrder?: number
  status: RbacStatus
}

export interface UpdatePermissionParams extends CreatePermissionParams {}
