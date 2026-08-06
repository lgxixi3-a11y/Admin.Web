import { defineStore } from 'pinia'
import { defineAsyncComponent, h, KeepAlive, markRaw, shallowRef } from 'vue'
import { RouterView } from 'vue-router'
import { buildMenuRoutes } from '@/utils/permission-route-utils.mjs'
import { useTagsViewStore } from '@/stores/tagsView'

const viewModules = require.context('../views', true, /\.vue$/, 'lazy')
// 组件对象不应被响应式代理(会导致性能开销并触发 Vue 警告),
// 这里直接以原对象定义, 放入 routes 时再统一 markRaw
const RouteView = markRaw({
  name: 'RouteView',
  setup() {
    const tagsViewStore = useTagsViewStore()
    return () => h(RouterView, null, {
      default: ({ Component }) => Component
        ? h(KeepAlive, { include: tagsViewStore.cachedViews }, [h(Component)])
        : null
    })
  }
})

function loadView(component) {
  const requested = `./${component}.vue`
  const fallback = './error/404.vue'
  const modulePath = viewModules.keys().includes(requested) ? requested : fallback
  const loader = () => viewModules(modulePath)
  loader.isNotFoundView = modulePath === fallback
  return loader
}

function cacheableComponent(name, component) {
  const LoadedView = markRaw(defineAsyncComponent(component))
  return markRaw({ name, render: () => h(LoadedView) })
}

function resolveComponents(routes) {
  return routes.map(route => {
    const isLayout = route.component === 'layout'
    const isNotFoundView = route.component?.isNotFoundView
    const meta = isNotFoundView ? { ...route.meta, hidden: true } : route.meta
    const component = isLayout
      ? RouteView
      : meta.cacheName
        ? cacheableComponent(meta.cacheName, route.component)
        : markRaw(route.component)
    return { ...route, meta, component, children: resolveComponents(route.children || []) }
  })
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    // 组件对象放入该数组后会被 addRoute 注册, 无需响应式追踪;
    // 用 shallowRef 避免深度代理路由/组件(触发 "Component was made reactive" 警告)
    routes: shallowRef([]),
    isRoutesLoaded: false,
    removeRouteHandlers: []
  }),
  actions: {
    generateRoutes(menus) {
      this.routes.value = resolveComponents(buildMenuRoutes(menus, loadView))
      this.isRoutesLoaded = true
      return this.routes.value
    },
    setRouteRemovers(handlers) {
      this.removeRouteHandlers = handlers
    },
    resetRoutes() {
      this.removeRouteHandlers.forEach(removeRoute => removeRoute())
      this.removeRouteHandlers = []
      this.routes.value = []
      this.isRoutesLoaded = false
    }
  }
})
