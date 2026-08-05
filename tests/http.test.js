const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const { transformSync } = require('@babel/core')

function loadHttp({ userStore, refresh }) {
  let requestInterceptor
  let responseInterceptor
  const retries = []
  const messages = []
  const redirects = []

  const service = config => {
    retries.push(config)
    return Promise.resolve({ retried: config.url, authorization: config.headers.Authorization })
  }
  service.interceptors = {
    request: { use: handler => { requestInterceptor = handler } },
    response: { use: (fulfilled, rejected) => { responseInterceptor = { fulfilled, rejected } } }
  }

  const axios = {
    create: () => service,
    post: refresh
  }
  const source = fs.readFileSync(path.join(__dirname, '../src/api/http.js'), 'utf8')
  const compiled = transformSync(source, {
    filename: 'http.js',
    plugins: ['@babel/plugin-transform-modules-commonjs']
  }).code
  const module = { exports: {} }
  const requireFromHttp = id => {
    if (id === 'axios') return axios
    if (id === 'element-plus') return { ElMessage: { error: message => messages.push(message) } }
    if (id === '@/stores/user') return { useUserStore: () => userStore }
    if (id === '@/router') return { replace: target => redirects.push(target) }
    return require(id)
  }

  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: requireFromHttp,
    Promise,
    Error,
    Object,
    Array,
    setTimeout
  })

  return { service: module.exports.default, requestInterceptor, responseInterceptor, retries, messages, redirects }
}

test('http injects the active bearer token and unwraps successful Result payloads', () => {
  const userStore = { token: 'access-token', refreshToken: '', setTokens() {}, logout() {} }
  const http = loadHttp({ userStore, refresh: async () => ({ data: { code: 200, data: {} } }) })

  const config = http.requestInterceptor({ headers: {} })
  assert.equal(config.headers.Authorization, 'Bearer access-token')
  assert.deepEqual(http.responseInterceptor.fulfilled({ data: { code: 200, data: { id: 7 } }, config: {} }), { id: 7 })
})

test('http refreshes once and replays every concurrent 401 request with the new bearer token', async () => {
  let completeRefresh
  let refreshCalls = 0
  const userStore = {
    token: 'expired-access',
    refreshToken: 'refresh-token',
    rememberMe: false,
    setTokens(accessToken, refreshToken, rememberMe) {
      this.token = accessToken
      this.refreshToken = refreshToken
      this.rememberMe = rememberMe
    },
    logout() { throw new Error('refresh should not fail') }
  }
  const http = loadHttp({
    userStore,
    refresh: () => {
      refreshCalls += 1
      return new Promise(resolve => { completeRefresh = resolve })
    }
  })

  const first = http.responseInterceptor.rejected({ response: { status: 401 }, config: { url: '/system/dict/type/page', headers: {} } })
  const second = http.responseInterceptor.rejected({ response: { status: 401 }, config: { url: '/tool/job/page', headers: {} } })
  assert.equal(refreshCalls, 1)

  completeRefresh({ data: { code: 200, data: { accessToken: 'fresh-access', refreshToken: 'fresh-refresh' } } })
  const replayed = await Promise.all([first, second])

  assert.deepEqual(replayed, [
    { retried: '/system/dict/type/page', authorization: 'Bearer fresh-access' },
    { retried: '/tool/job/page', authorization: 'Bearer fresh-access' }
  ])
  assert.equal(userStore.refreshToken, 'fresh-refresh')
  assert.equal(userStore.rememberMe, false)
})

test('http does not refresh a rejected login request', async () => {
  let refreshCalls = 0
  const userStore = { token: '', refreshToken: 'refresh-token', setTokens() {}, logout() {} }
  const http = loadHttp({ userStore, refresh: async () => { refreshCalls += 1 } })

  await assert.rejects(
    http.responseInterceptor.rejected({ response: { status: 401 }, config: { url: '/auth/login', headers: {} } })
  )
  assert.equal(refreshCalls, 0)
  assert.deepEqual(http.messages, ['登录已失效，请重新登录'])
})

test('http gives actionable messages for missing resources and stale permission snapshots', async () => {
  const userStore = { token: 'access-token', refreshToken: '', setTokens() {}, logout() {} }
  const http = loadHttp({ userStore, refresh: async () => ({ data: { code: 200, data: {} } }) })

  await assert.rejects(http.responseInterceptor.rejected({ response: { status: 404 }, config: {} }))
  await assert.rejects(http.responseInterceptor.rejected({ response: { status: 403 }, config: {} }))

  assert.deepEqual(http.messages, [
    '请求的资源不存在(404)，请检查权限或刷新页面',
    '无权限访问，若刚分配权限请重新登录后生效'
  ])
})
