import type { RouteRecordRaw } from 'vue-router'

// 后台业务路由表，登录后按 meta.permission 过滤生成可访问路由与侧边菜单
// permission 为空表示登录后即可访问，无需额外权限码
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: 'routes',
    name: 'RouteManage',
    component: () => import('@/views/route/RouteManageView.vue'),
    meta: { title: '路线管理', icon: 'Guide' },
  },
  {
    path: 'route-cost-items',
    name: 'RouteCostItemManage',
    component: () => import('@/views/route/RouteCostItemManageView.vue'),
    meta: { title: '路线花费管理', icon: 'Tickets', permission: 'route:list' },
  },
  {
    path: 'route-parking-points',
    name: 'RouteParkingPointManage',
    component: () => import('@/views/route/RouteParkingPointManageView.vue'),
    meta: { title: '路线停车点管理', icon: 'Location', permission: 'route:list' },
  },
  {
    path: 'traffic-profiles',
    name: 'TrafficProfileManage',
    component: () => import('@/views/route/TrafficProfileManageView.vue'),
    meta: { title: '交通画像管理', icon: 'Clock', permission: 'route:list' },
  },
  {
    path: 'transport-cost-items',
    name: 'TransportCostItemManage',
    component: () => import('@/views/route/TransportCostItemManageView.vue'),
    meta: { title: '交通花费管理', icon: 'Money', permission: 'route:list' },
  },
  // {
  //   path: 'chatbi',
  //   name: 'ChatBI',
  //   component: () => import('@/views/chatbi/ChatBIView.vue'),
  //   meta: { title: 'ChatBI 助手', icon: 'ChatDotRound' },
  // },
  {
    path: 'rbac/users',
    name: 'RbacUserManage',
    component: () => import('@/views/rbac/UserManageView.vue'),
    meta: { title: '用户管理', icon: 'User', permission: 'rbac:user:list' },
  },
  {
    path: 'rbac/roles',
    name: 'RbacRoleManage',
    component: () => import('@/views/rbac/RoleManageView.vue'),
    meta: { title: '角色管理', icon: 'UserFilled', permission: 'rbac:role:list' },
  },
  {
    path: 'rbac/permissions',
    name: 'RbacPermissionManage',
    component: () => import('@/views/rbac/PermissionManageView.vue'),
    meta: { title: '权限管理', icon: 'Lock', permission: 'rbac:permission:list' },
  },
]

// 按用户 permissions 过滤出可访问的路由（供路由注入与侧边菜单共用）
export function filterRoutesByPermission(
  routes: RouteRecordRaw[],
  permissions: string[],
): RouteRecordRaw[] {
  return routes.filter((route) => {
    const required = route.meta?.permission as string | undefined
    return !required || permissions.includes(required)
  })
}

