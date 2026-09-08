import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { asyncRoutes, filterRoutesByPermission } from './asyncRoutes'
import { useAuthStore } from '@/stores/auth'

const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/LoginView.vue'),
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('@/layouts/MainLayout.vue'),
    // 默认展示路线管理页，若当前用户无该权限则回退到其可访问的第一个页面
    redirect: () => {
      const authStore = useAuthStore()
      const accessible = filterRoutesByPermission(asyncRoutes, authStore.permissions)
      const preferred = accessible.find((route) => route.path === 'routes')
      return `/${(preferred ?? accessible[0])?.path ?? '403'}`
    },
    children: [],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
})

let dynamicRouteRemovers: Array<() => void> = []

function addDynamicRoutes(permissions: string[]) {
  const accessible = filterRoutesByPermission(asyncRoutes, permissions)
  dynamicRouteRemovers = accessible.map((route) => router.addRoute('Layout', route))
}

// 登出时清除已注入的动态路由，避免残留上一位用户的可访问页面
export function resetRouter() {
  dynamicRouteRemovers.forEach((remove) => remove())
  dynamicRouteRemovers = []
}

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const loggedIn = authStore.isLoggedIn()

  if (!loggedIn) {
    if (to.path === '/login') return true
    authStore.reset()
    resetRouter()
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login') {
    return '/'
  }

  // 刷新页面等场景下动态路由尚未注入，先注入再重新匹配当前地址
  if (!authStore.routesLoaded) {
    addDynamicRoutes(authStore.permissions)
    authStore.routesLoaded = true
    return to.fullPath
  }

  return true
})

export default router
