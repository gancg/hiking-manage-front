import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import type { ApiResponse } from '@/types/api'
import { clearAuthStorage, getToken } from './auth-storage'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

request.interceptors.response.use(
  // 拦截器在运行时把响应体解包为 data，但类型层面仍标注为 AxiosResponse，调用方通过 request.get<T, T> 拿到真实类型
  (response: AxiosResponse<ApiResponse>) => {
    const { code, message, data } = response.data
    if (code !== 0) {
      if (code === 401) {
        clearAuthStorage()
        router.push('/login')
        // 登录失败时展示后端提示，其他接口保留原有登录失效处理
        if (response.config.url === '/auth/login') {
          ElMessage.error(message)
        }
      } else {
        ElMessage.error(message || '请求失败')
      }
      return Promise.reject(new Error(message || '请求失败'))
    }
    // 运行时返回的是解包后的 data，调用方通过 request.get<T, T> 让类型与之对齐
    return data as unknown as AxiosResponse<ApiResponse>
  },
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status
    const message = error.response?.data?.message
    if (status === 401) {
      clearAuthStorage()
      router.push('/login')
    }
    ElMessage.error(message || error.message || '网络异常')
    return Promise.reject(error)
  },
)

export default request
