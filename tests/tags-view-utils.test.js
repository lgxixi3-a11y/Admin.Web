const assert = require('node:assert/strict')
const test = require('node:test')

test('taggableRoute excludes login, 404, redirects, hidden routes, and unmatched routes', async () => {
  const { isTaggableRoute } = await import('../src/utils/tags-view-utils.mjs')

  assert.equal(isTaggableRoute({ path: '/dashboard', fullPath: '/dashboard', name: 'Dashboard', matched: [{}], meta: {} }), true)
  assert.equal(isTaggableRoute({ path: '/login', fullPath: '/login', name: 'Login', matched: [{}], meta: {} }), false)
  assert.equal(isTaggableRoute({ path: '/404', fullPath: '/404', name: 'NotFound', matched: [{}], meta: {} }), false)
  assert.equal(isTaggableRoute({ path: '/users', fullPath: '/users', name: 'Users', matched: [{}], redirectedFrom: {}, meta: {} }), false)
  assert.equal(isTaggableRoute({ path: '/secret', fullPath: '/secret', name: 'Secret', matched: [{}], meta: { hidden: true } }), false)
  assert.equal(isTaggableRoute({ path: '/missing', fullPath: '/missing', name: 'Missing', matched: [], meta: {} }), false)
})

test('toVisitedView uses fullPath as identity and cacheName only for cached routes', async () => {
  const { toVisitedView } = await import('../src/utils/tags-view-utils.mjs')

  assert.deepEqual(toVisitedView({
    path: '/system/user', fullPath: '/system/user?page=2', name: 'Menu201', matched: [{}],
    meta: { title: '用户管理', cache: true }
  }), {
    path: '/system/user', fullPath: '/system/user?page=2', name: 'Menu201', title: '用户管理', affix: false, cacheName: 'Menu201'
  })
  assert.equal(toVisitedView({ path: '/log', fullPath: '/log', name: 'Logs', matched: [{}], meta: { title: '日志' } }).cacheName, '')
})

test('nextViewAfterClose chooses the right neighbor, then the left neighbor, then the affixed fallback', async () => {
  const { nextViewAfterClose } = await import('../src/utils/tags-view-utils.mjs')
  const home = { fullPath: '/dashboard', affix: true }
  const users = { fullPath: '/users', affix: false }
  const roles = { fullPath: '/roles', affix: false }

  assert.equal(nextViewAfterClose([home, users, roles], users), roles)
  assert.equal(nextViewAfterClose([home, users], users), home)
  assert.equal(nextViewAfterClose([home], home), home)
})

test('visited view helpers preserve affixed views and derive unique cache names from retained tags', async () => {
  const { appendVisitedView, removeVisitedView, retainOnlyView, getCachedViewNames } = await import('../src/utils/tags-view-utils.mjs')
  const home = { fullPath: '/dashboard', affix: true, cacheName: 'DashboardPage' }
  const users = { fullPath: '/users', affix: false, cacheName: 'Menu201' }
  const usersQuery = { fullPath: '/users?page=2', affix: false, cacheName: 'Menu201' }

  const added = appendVisitedView([home, users], usersQuery)
  assert.deepEqual(added, [home, users, usersQuery])
  assert.equal(appendVisitedView(added, usersQuery), added)
  assert.deepEqual(removeVisitedView(added, home), added)
  assert.deepEqual(removeVisitedView(added, users), [home, usersQuery])
  assert.deepEqual(retainOnlyView(added, users), [home, users])
  assert.deepEqual(getCachedViewNames([home, users, usersQuery]), ['DashboardPage', 'Menu201'])
})
