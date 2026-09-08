import request from '@/utils/request'
import type { PageQuery, PageResult } from '@/types/api'
import type { CreateRouteParams, RouteDetailDto, RouteDto, UpdateRouteParams } from '@/types/route'

export function getRoutes(params?: PageQuery) {
  return request.get<PageResult<RouteDto>, PageResult<RouteDto>>('/routes', { params })
}

export function getRouteDetail(id: string) {
  return request.get<RouteDetailDto, RouteDetailDto>(`/routes/${id}`)
}

export function createRoute(params: CreateRouteParams) {
  return request.post<null, null>('/routes', params)
}

export function updateRoute(id: string, params: UpdateRouteParams) {
  return request.put<null, null>(`/routes/${id}`, params)
}

export function deleteRoute(id: string) {
  return request.delete<null, null>(`/routes/${id}`)
}
