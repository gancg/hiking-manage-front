import request from '@/utils/request'
import type { PageResult } from '@/types/api'
import type { TransportCostItemDto, TransportCostItemParams, TransportCostItemQuery } from '@/types/transport-cost-item'

// 分页查询交通花费，可按所属路线筛选
export function getTransportCostItems(params: TransportCostItemQuery) {
  return request.get<PageResult<TransportCostItemDto>, PageResult<TransportCostItemDto>>('/transport-cost-items', { params })
}

// 获取单条交通花费详情
export function getTransportCostItemDetail(id: number) {
  return request.get<TransportCostItemDto, TransportCostItemDto>(`/transport-cost-items/${id}`)
}

// 新增交通花费，关联已存在的路线
export function createTransportCostItem(params: TransportCostItemParams) {
  return request.post<TransportCostItemDto, TransportCostItemDto>('/transport-cost-items', params)
}

// 全量更新交通花费的全部业务字段
export function updateTransportCostItem(id: number, params: TransportCostItemParams) {
  return request.put<null, null>(`/transport-cost-items/${id}`, params)
}

// 删除单条交通花费
export function deleteTransportCostItem(id: number) {
  return request.delete<null, null>(`/transport-cost-items/${id}`)
}
