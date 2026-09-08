import 'vue-router'

// 扩展路由 meta 字段类型
declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    icon?: string
    permission?: string
  }
}
