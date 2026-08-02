const BUTTON_MENU_TYPE = 3

export function hasPermission(perms, required) {
  if (!required) return true

  const requirements = Array.isArray(required) ? required : [required]
  return requirements.some(permission => perms.includes(permission))
}

export function buildMenuRoutes(menus, resolveComponent) {
  return (menus || [])
    .filter(menu => Number(menu.menuType) !== BUTTON_MENU_TYPE && isNavigable(menu))
    .map(menu => ({
      path: menu.path || '',
      name: `Menu${menu.id}`,
      component: isLayout(menu.component) ? 'layout' : resolveComponent(normalizeComponent(menu.component)),
      meta: {
        title: menu.menuName || '未命名菜单',
        icon: menu.icon || '',
        cache: Number(menu.cacheFlag) === 1,
        hidden: Number(menu.visible) === 0
      },
      children: buildMenuRoutes(menu.children, resolveComponent)
    }))
}

function isNavigable(menu) {
  const path = String(menu.path || '').trim()
  return path.length > 0 && !path.includes('..')
}

function isLayout(component) {
  return ['layout', 'mainlayout'].includes(String(component || '').toLowerCase())
}

function normalizeComponent(component) {
  return String(component || 'error/404')
    .replace(/^\/+|\.vue$/g, '')
    .replace(/\\/g, '/')
}
