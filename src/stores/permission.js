import { defineStore } from 'pinia'
import { defineAsyncComponent, h, KeepAlive } from 'vue'
import { RouterView } from 'vue-router'
import { buildMenuRoutes } from '@/utils/permission-route-utils.mjs'
import { useTagsViewStore } from '@/stores/tagsView'

const viewModules = require.context('../views', true, /\.vue$/, 'lazy')
const RouteView = {
  name: 'RouteView',
  setup() {
    const tagsViewStore = useTagsViewStore()
    return () => h(RouterView, null, {
      default: ({ Component }) => Component
        ? h(KeepAlive, { include: tagsViewStore.cachedViews }, [h(Component)])
        : null
    })
  }
}

function loadView(component) {
  const requested = `./${component}.vue`
  const fallback = './error/404.vue'
  const modulePath = viewModules.keys().includes(requested) ? requested : fallback
  const loader = () => viewModules(modulePath)
  loader.isNotFoundView = modulePath === fallback
  return loader
}

function cacheableComponent(name, component) {
  const LoadedView = defineAsyncComponent(component)
  return { name, render: () => h(LoadedView) }
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
        : route.component
    return { ...route, meta, component, children: resolveComponents(route.children || []) }
  })
}

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    routes: [],
    isRoutesLoaded: false,
    removeRouteHandlers: []
  }),
  actions: {
    generateRoutes(menus) {
      this.routes = resolveComponents(buildMenuRoutes(menus, loadView))
      this.isRoutesLoaded = true
      return this.routes
    },
    setRouteRemovers(handlers) {
      this.removeRouteHandlers = handlers
    },
    resetRoutes() {
      this.removeRouteHandlers.forEach(removeRoute => removeRoute())
      this.removeRouteHandlers = []
      this.routes = []
      this.isRoutesLoaded = false
    }
  }
})
