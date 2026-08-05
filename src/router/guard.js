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
      // 不能重放 { ...to }: 首次导航时动态路由尚未注册, 深层路径(如 /system/user)
      // 会被通配路由 :pathMatch(.*)* 抢先重定向到 /404, 此时 to 已是 /404 的解析结果,
      // 直接重放会把用户打进 404 页。应回到原始目标(含 query/hash), 让 vue-router
      // 按已注册路由重新解析。
      if (to.redirectedFrom) {
        return {
          path: to.redirectedFrom.path,
          query: to.redirectedFrom.query,
          hash: to.redirectedFrom.hash,
          replace: true
        }
      }
      return { path: to.fullPath, replace: true }
    } catch (error) {
      userStore.logout()
      return { path: '/login', query: { redirect: to.redirectedFrom?.fullPath || to.fullPath } }
    }
  }

  return true
})

router.afterEach((to, from, failure) => {
  if (!failure) useTagsViewStore().addView(to)
  document.title = `${to.meta.title || 'Admin'} - Admin`
})
