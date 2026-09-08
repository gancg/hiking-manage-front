import type { PageQuery } from '@/types/api'

// 停车点新增和全量更新参数
export interface RouteParkingPointParams {
  routeId: string
  name: string
  latitude: number
  longitude: number
  note: string | null
  isRecommended: 0 | 1
  isReviewed: 0 | 1
  sourceUrl: string
}

// 停车点列表及详情响应
export interface RouteParkingPointDto extends RouteParkingPointParams {
  id: number
  updatedAt: string
}

// 停车点分页筛选参数
export interface RouteParkingPointQuery extends PageQuery {
  routeId?: string
}
