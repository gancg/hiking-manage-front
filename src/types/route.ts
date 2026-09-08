export type RouteDifficulty = 'easy' | 'moderate' | 'hard' | 'expert'

// 后端返回的路线对象，*Json 字段仍为 JSON 数组文本，标记字段为数字 0/1
export interface RouteDto {
  id: string
  name: string
  startLocation: string
  endLocation: string
  latitude: number | null
  longitude: number | null
  distanceKm: number
  ascentM: number
  highestAltitudeM: number
  hikingMinutes: number
  difficulty: RouteDifficulty
  durationDays: number
  routeType: string
  bestSeasonsJson: string
  sceneryJson: string
  risksJson: string
  transportModesJson: string
  costMinCny: number
  costMaxCny: number
  parking: string | null
  supplies: string | null
  signal: string | null
  camping: string | null
  sourceUrl: string
  sourceName: string
  collectedAt: string
  confidence: number
  reviewed: number
  hasToilet: number
  hasSupplyShop: number
  isTraverse: number
  traverseTransferMinutes: number
  groupTourSearchTermsJson: string
  updatedAt: string
}

export type RouteDetailDto = RouteDto

export interface RouteParams {
  id?: string
  name: string
  startLocation: string
  endLocation: string
  latitude?: number | null
  longitude?: number | null
  distanceKm: number
  ascentM: number
  highestAltitudeM: number
  hikingMinutes: number
  difficulty: RouteDifficulty
  durationDays: number
  routeType: string
  bestSeasonsJson: string
  sceneryJson: string
  risksJson: string
  transportModesJson: string
  costMinCny: number
  costMaxCny: number
  parking?: string | null
  supplies?: string | null
  signal?: string | null
  camping?: string | null
  sourceUrl: string
  sourceName: string
  collectedAt: string
  confidence: number
  reviewed?: number
  hasToilet?: number
  hasSupplyShop?: number
  isTraverse?: number
  traverseTransferMinutes?: number
  groupTourSearchTermsJson?: string
}

export interface CreateRouteParams extends RouteParams {
  id: string
}

export type UpdateRouteParams = RouteParams
