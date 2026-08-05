const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const { transformSync } = require('@babel/core')

function createStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: key => data.get(key) || null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  }
}

function loadUserStore({ local = {}, session = {} } = {}) {
  const localStorage = createStorage(local)
  const sessionStorage = createStorage(session)
  let resetRoutesCalls = 0
  const source = fs.readFileSync(path.join(__dirname, '../src/stores/user.js'), 'utf8')
  const compiled = transformSync(source, {
    filename: 'user.js',
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code
  const module = { exports: {} }
  const requireFromUserStore = id => {
    if (id === 'pinia') {
      return {
        defineStore: (_id, options) => () => {
          const store = options.state()
          Object.entries(options.actions).forEach(([name, action]) => {
            store[name] = (...args) => action.apply(store, args)
          })
          return store
        }
      }
    }
    if (id === '@/api/auth') return { getUserInfo: async () => ({}) }
    if (id === '@/stores/permission') return { usePermissionStore: () => ({ resetRoutes: () => { resetRoutesCalls += 1 } }) }
    if (id === '@/utils/user-info-utils.mjs') return { normalizeUserInfo: value => value }
    return require(id)
  }

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: requireFromUserStore,
    localStorage,
    sessionStorage,
    Boolean,
    Object,
    Promise,
    Error
  })

  return { store: module.exports.useUserStore(), localStorage, sessionStorage, resetRoutesCalls: () => resetRoutesCalls }
}

test('user store restores a remembered login from localStorage and keeps its strategy after token rotation', () => {
  const { store, localStorage, sessionStorage } = loadUserStore({
    local: { 'admin-token': 'old-access', 'admin-refresh-token': 'old-refresh' }
  })

  assert.equal(store.token, 'old-access')
  assert.equal(store.refreshToken, 'old-refresh')
  assert.equal(store.rememberMe, true)

  store.setTokens('new-access', 'new-refresh', store.rememberMe)

  assert.equal(localStorage.getItem('admin-token'), 'new-access')
  assert.equal(localStorage.getItem('admin-refresh-token'), 'new-refresh')
  assert.equal(sessionStorage.getItem('admin-token'), null)
  assert.equal(sessionStorage.getItem('admin-refresh-token'), null)
})

test('user store stores an unremembered login in sessionStorage and removes stale local tokens', () => {
  const { store, localStorage, sessionStorage } = loadUserStore({
    local: { 'admin-token': 'stale-access', 'admin-refresh-token': 'stale-refresh' }
  })

  store.setTokens('session-access', 'session-refresh', false)

  assert.equal(store.rememberMe, false)
  assert.equal(sessionStorage.getItem('admin-token'), 'session-access')
  assert.equal(sessionStorage.getItem('admin-refresh-token'), 'session-refresh')
  assert.equal(localStorage.getItem('admin-token'), null)
  assert.equal(localStorage.getItem('admin-refresh-token'), null)
})

test('user store logout removes tokens from both browser storages', () => {
  const { store, localStorage, sessionStorage, resetRoutesCalls } = loadUserStore({
    local: { 'admin-token': 'local-access', 'admin-refresh-token': 'local-refresh' },
    session: { 'admin-token': 'session-access', 'admin-refresh-token': 'session-refresh' }
  })

  store.logout()

  assert.equal(store.token, '')
  assert.equal(store.refreshToken, '')
  assert.equal(localStorage.getItem('admin-token'), null)
  assert.equal(localStorage.getItem('admin-refresh-token'), null)
  assert.equal(sessionStorage.getItem('admin-token'), null)
  assert.equal(sessionStorage.getItem('admin-refresh-token'), null)
  assert.equal(resetRoutesCalls(), 1)
})
