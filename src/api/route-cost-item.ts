import request from '@/utils/request'
import type { PageResult } from '@/types/api'
import type { RouteCostItemDto, RouteCostItemParams, RouteCostItemQuery } from '@/types/route-cost-item'

// 分页查询路线花费，可按所属路线筛选
export function getRouteCostItems(params: RouteCostItemQuery) {
  return request.get<PageResult<RouteCostItemDto>, PageResult<RouteCostItemDto>>('/route-cost-items', { params })
}

// 获取单条路线花费详情
export function getRouteCostItemDetail(id: number) {
  return request.get<RouteCostItemDto, RouteCostItemDto>(`/route-cost-items/${id}`)
}

// 新增花费，关联已存在的路线
export function createRouteCostItem(params: RouteCostItemParams) {
  return request.post<RouteCostItemDto, RouteCostItemDto>('/route-cost-items', params)
}

// 全量更新路线花费的全部业务字段
export function updateRouteCostItem(id: number, params: RouteCostItemParams) {
  return request.put<null, null>(`/route-cost-items/${id}`, params)
}

// 删除单条路线花费
export function deleteRouteCostItem(id: number) {
  return request.delete<null, null>(`/route-cost-items/${id}`)
}
