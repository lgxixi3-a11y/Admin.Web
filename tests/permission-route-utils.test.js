const assert = require('node:assert/strict')
const test = require('node:test')

test('buildMenuRoutes removes button nodes while retaining nested menu metadata', async () => {
  const { buildMenuRoutes } = await import('../src/utils/permission-route-utils.mjs')
  const menus = [{
    id: 1,
    menuName: '系统管理',
    menuType: 1,
    path: '/system',
    component: 'Layout',
    children: [{
      id: 2,
      menuName: '用户管理',
      menuType: 2,
      path: 'user',
      component: 'system/user/index',
      icon: 'User',
      cacheFlag: 1,
      children: [{ id: 3, menuName: '新增用户', menuType: 3, perms: 'system:user:add' }]
    }]
  }, {
    id: 4,
    menuName: '无效菜单',
    menuType: 2,
    component: 'system/invalid/index'
  }]

  const routes = buildMenuRoutes(menus, component => `view:${component}`)

  assert.equal(routes.length, 1)
  assert.equal(routes[0].component, 'layout')
  assert.equal(routes[0].children[0].component, 'view:system/user/index')
  assert.deepEqual(routes[0].children[0].meta, { title: '用户管理', icon: 'User', cache: true, hidden: false })
  assert.equal(routes[0].children[0].children.length, 0)
  assert.equal(routes.find(route => route.name === 'Menu4'), undefined)
})

test('hasPermission accepts a string and grants arrays when any permission matches', async () => {
  const { hasPermission } = await import('../src/utils/permission-route-utils.mjs')

  assert.equal(hasPermission(['system:user:add'], 'system:user:add'), true)
  assert.equal(hasPermission(['system:user:add'], 'system:user:edit'), false)
  assert.equal(hasPermission(['system:user:add'], ['system:user:edit', 'system:user:add']), true)
})
