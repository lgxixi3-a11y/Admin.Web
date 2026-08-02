import { defineStore } from 'pinia'
import { h } from 'vue'
import { RouterView } from 'vue-router'
import { buildMenuRoutes } from '@/utils/permission-route-utils.mjs'

const viewModules = require.context('../views', true, /\.vue$/, 'lazy')
const RouteView = { name: 'RouteView', render: () => h(RouterView) }

function loadView(component) {
  const requested = `./${component}.vue`
  const fallback = './error/404.vue'
  const modulePath = viewModules.keys().includes(requested) ? requested : fallback
  return () => viewModules(modulePath)
}

function resolveComponents(routes) {
  return routes.map(route => ({
    ...route,
    component: route.component === 'layout' ? RouteView : route.component,
    children: resolveComponents(route.children || [])
  }))
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
