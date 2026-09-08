// 按钮级权限指令：v-permission="'rbac:user:create'"，无权限时移除该元素
import type { Directive, DirectiveBinding } from 'vue'
import { useAuthStore } from '@/stores/auth'

function checkPermission(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
  const authStore = useAuthStore()
  const value = binding.value
  const required = Array.isArray(value) ? value : [value]
  const granted = required.every((code) => authStore.hasPermission(code))
  if (!granted) {
    el.parentNode?.removeChild(el)
  }
}

export const permission: Directive<HTMLElement, string | string[]> = {
  mounted: checkPermission,
}
