import request from '@/utils/request'
import type { PageResult } from '@/types/api'
import type { CreateTrafficProfileParams, TrafficProfileDto, TrafficProfileParams, TrafficProfileQuery } from '@/types/traffic-profile'

// 分页查询交通画像，可按所属路线筛选
export function getTrafficProfiles(params: TrafficProfileQuery) {
  return request.get<PageResult<TrafficProfileDto>, PageResult<TrafficProfileDto>>('/traffic-profiles', { params })
}

// 获取单条交通画像详情
export function getTrafficProfileDetail(routeId: string) {
  return request.get<TrafficProfileDto, TrafficProfileDto>(`/traffic-profiles/${encodeURIComponent(routeId)}`)
}

// 新增交通画像，关联已存在的路线
export function createTrafficProfile(params: CreateTrafficProfileParams) {
  return request.post<TrafficProfileDto, TrafficProfileDto>('/traffic-profiles', params)
}

// 全量更新交通画像的全部业务字段
export function updateTrafficProfile(routeId: string, params: TrafficProfileParams) {
  return request.put<null, null>(`/traffic-profiles/${encodeURIComponent(routeId)}`, params)
}

// 删除单条交通画像
export function deleteTrafficProfile(routeId: string) {
  return request.delete<null, null>(`/traffic-profiles/${encodeURIComponent(routeId)}`)
}
