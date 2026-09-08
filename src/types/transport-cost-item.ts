import type { PageQuery } from '@/types/api'

export type BillingUnit = 'person' | 'vehicle' | 'group'
export type CostType = 'fuel' | 'toll' | 'train' | 'bus' | 'other'
export type TransportMode = 'self_drive' | 'public_transit' | 'carpool' | 'group_tour'

// 交通花费新增和全量更新参数
export interface TransportCostItemParams {
  routeId: string
  name: string
  billingUnit: BillingUnit
  costType: CostType
  transportMode: TransportMode
  minCny: number
  maxCny: number
  sourceUrl: string
}

// 交通花费列表及详情响应
export interface TransportCostItemDto extends TransportCostItemParams {
  id: number
  updatedAt: string
}

// 交通花费分页筛选参数
export interface TransportCostItemQuery extends PageQuery {
  routeId?: string
}
