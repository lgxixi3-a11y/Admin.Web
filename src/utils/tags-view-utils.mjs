const EXCLUDED_PATHS = new Set(['/login', '/404'])
const EXCLUDED_NAMES = new Set(['Login', 'NotFound'])

export function isTaggableRoute(route) {
  if (!route?.path || route.meta?.hidden) return false
  if (EXCLUDED_PATHS.has(route.path) || EXCLUDED_NAMES.has(String(route.name || ''))) return false
  if (route.redirectedFrom && !route.meta?.affix) return false
  return Array.isArray(route.matched) && route.matched.length > 0
}

export function toVisitedView(route) {
  const cacheName = route.meta?.cache ? (route.meta.cacheName || String(route.name || '')) : ''
  return {
    path: route.path,
    fullPath: route.fullPath || route.path,
    name: route.name || '',
    title: route.meta?.title || '未命名',
    affix: Boolean(route.meta?.affix),
    cacheName
  }
}

export function nextViewAfterClose(views, closingView) {
  const index = views.findIndex(view => view.fullPath === closingView.fullPath)
  if (index < 0) return views.find(view => view.affix) || views[0] || null

  return views[index + 1]
    || views[index - 1]
    || views.find(view => view.affix)
    || null
}

export function appendVisitedView(views, view) {
  return views.some(item => item.fullPath === view.fullPath) ? views : [...views, view]
}

export function removeVisitedView(views, view) {
  return views.filter(item => item.affix || item.fullPath !== view.fullPath)
}

export function retainOnlyView(views, view) {
  return views.filter(item => item.affix || item.fullPath === view.fullPath)
}

export function getCachedViewNames(views) {
  return [...new Set(views.map(view => view.cacheName).filter(Boolean))]
}
