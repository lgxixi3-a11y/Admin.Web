import router from './index'
import { useUserStore } from '@/stores/user'
import { usePermissionStore } from '@/stores/permission'
import { useTagsViewStore } from '@/stores/tagsView'

router.beforeEach(async to => {
  const userStore = useUserStore()
  const permissionStore = usePermissionStore()

  if (!userStore.token) {
    if (to.path === '/login') return true
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login') return { path: '/' }

  if (!permissionStore.isRoutesLoaded) {
    try {
      await userStore.getInfo()
      const routes = permissionStore.generateRoutes(userStore.menus)
      permissionStore.setRouteRemovers(routes.map(route => router.addRoute('Root', route)))
      return { ...to, replace: true }
    } catch (error) {
      userStore.logout()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  return true
})

router.afterEach((to, from, failure) => {
  if (!failure) useTagsViewStore().addView(to)
  document.title = `${to.meta.title || 'Admin'} - Admin`
})
