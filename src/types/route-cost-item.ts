import type { PageQuery } from '@/types/api'

export type BillingUnit = 'person' | 'vehicle' | 'group'
export type CostType = 'ticket' | 'shuttle' | 'waste' | 'parking' | 'other'

// 新增和全量更新路线花费的请求参数
export interface RouteCostItemParams {
  routeId: string
  name: string
  billingUnit: BillingUnit
  minCny: number
  maxCny: number
  sourceUrl: string
  costType: CostType
}

// 路线花费详情及列表记录
export interface RouteCostItemDto extends RouteCostItemParams {
  id: number
  updatedAt: string
}

// 路线花费分页及所属路线筛选参数
export interface RouteCostItemQuery extends PageQuery {
  routeId?: string
}
