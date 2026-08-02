import { useUserStore } from '@/stores/user'
import { hasPermission } from '@/utils/permission-route-utils.mjs'

export const permission = {
  mounted(el, binding) {
    const userStore = useUserStore()
    if (!hasPermission(userStore.perms, binding.value)) el.remove()
  }
}
