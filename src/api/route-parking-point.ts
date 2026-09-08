import request from '@/utils/request'
import type { PageResult } from '@/types/api'
import type { RouteParkingPointDto, RouteParkingPointParams, RouteParkingPointQuery } from '@/types/route-parking-point'

// 分页查询路线停车点，可按所属路线筛选
export function getRouteParkingPoints(params: RouteParkingPointQuery) {
  return request.get<PageResult<RouteParkingPointDto>, PageResult<RouteParkingPointDto>>('/route-parking-points', { params })
}

// 获取单条路线停车点详情
export function getRouteParkingPointDetail(id: number) {
  return request.get<RouteParkingPointDto, RouteParkingPointDto>(`/route-parking-points/${id}`)
}

// 新增路线停车点，关联已存在的路线
export function createRouteParkingPoint(params: RouteParkingPointParams) {
  return request.post<RouteParkingPointDto, RouteParkingPointDto>('/route-parking-points', params)
}

// 全量更新路线停车点的全部业务字段
export function updateRouteParkingPoint(id: number, params: RouteParkingPointParams) {
  return request.put<null, null>(`/route-parking-points/${id}`, params)
}

// 删除单条路线停车点
export function deleteRouteParkingPoint(id: number) {
  return request.delete<null, null>(`/route-parking-points/${id}`)
}
