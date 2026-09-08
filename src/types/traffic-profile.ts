import type { PageQuery } from '@/types/api'

// 交通画像全量更新参数，所属路线由路径指定
export interface TrafficProfileParams {
  baseOneWayMinutes: number
  weekdayExtraMin: number
  weekdayExtraMax: number
  weekendExtraMin: number
  weekendExtraMax: number
  holidayExtraMin: number
  holidayExtraMax: number
  morningExtraMinutes: number
  eveningExtraMinutes: number
  commonBottlenecksJson: string
  bestDepartureTime: string | null
  suggestedReturnTime: string | null
  sourceUrl: string
  confidence: number
}

// 新增交通画像时必须指定已有路线
export interface CreateTrafficProfileParams extends TrafficProfileParams {
  routeId: string
}

// 交通画像列表及详情响应
export interface TrafficProfileDto extends CreateTrafficProfileParams {
  updatedAt: string
}

// 交通画像分页筛选参数
export interface TrafficProfileQuery extends PageQuery {
  routeId?: string
}
