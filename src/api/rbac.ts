import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/api'
import type {
  CreatePermissionParams,
  CreateRoleParams,
  CreateUserParams,
  PermissionDetailDto,
  PermissionDto,
  RbacUserDetailDto,
  RbacUserDto,
  RoleDetailDto,
  RoleDto,
  UpdatePermissionParams,
  UpdateRoleParams,
  UpdateUserParams,
  UserStatus,
} from '@/types/rbac'

export function getUsers() {
  return request.get<RbacUserDto[], RbacUserDto[]>('/rbac/users')
}

export function getUserDetail(id: number) {
  return request.get<RbacUserDetailDto, RbacUserDetailDto>(`/rbac/users/${id}`)
}

export function createUser(params: CreateUserParams) {
  return request.post<null, null>('/rbac/create', params)
}

export function updateUser(id: number, params: UpdateUserParams) {
  return request.put<null, null>(`/rbac/users/${id}`, params)
}

export function deleteUser(id: number) {
  return request.delete<null, null>(`/rbac/users/${id}`)
}

export function resetUserPassword(id: number) {
  return request.post<null, null>(`/rbac/users/${id}/reset-password`)
}

export function updateUserStatus(id: number, status: UserStatus) {
  return request.patch<null, null>(`/rbac/users/${id}/status`, { status })
}

export function getRoles() {
  return request.get<RoleDto[], RoleDto[]>('/rbac/roles')
}

export function getRoleDetail(id: number) {
  return request.get<RoleDetailDto, RoleDetailDto>(`/rbac/roles/${id}`)
}

export function createRole(params: CreateRoleParams) {
  return request.post<null, null>('/rbac/roles', params)
}

export function updateRole(id: number, params: UpdateRoleParams) {
  return request.put<null, null>(`/rbac/roles/${id}`, params)
}

export function deleteRole(id: number) {
  return request.delete<null, null>(`/rbac/roles/${id}`)
}

export function getPermissions(params?: PageQuery) {
  return request.get<PageResult<PermissionDto>, PageResult<PermissionDto>>('/rbac/permissions', {
    params,
  })
}

export async function getAllPermissions() {
  const firstPage = await getPermissions({ pageNum: 1, pageSize: 1 })
  if (firstPage.total <= 1) {
    return firstPage.records
  }

  const allPage = await getPermissions({ pageNum: 1, pageSize: firstPage.total })
  return allPage.records
}

export function getPermissionDetail(id: number) {
  return request.get<PermissionDetailDto, PermissionDetailDto>(`/rbac/permissions/${id}`)
}

export function createPermission(params: CreatePermissionParams) {
  return request.post<null, null>('/rbac/permissions', params)
}

export function updatePermission(id: number, params: UpdatePermissionParams) {
  return request.put<null, null>(`/rbac/permissions/${id}`, params)
}

export function deletePermission(id: number) {
  return request.delete<null, null>(`/rbac/permissions/${id}`)
}
