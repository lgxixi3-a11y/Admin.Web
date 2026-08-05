import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const service = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

let isRefreshing = false
let queue = []

function isAuthEndpoint(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/refresh')
}

function shouldNotify(config) {
  return !config?.silent
}

function showError(message, config) {
  if (shouldNotify(config)) ElMessage.error(message)
}

function redirectToLogin() {
  const userStore = useUserStore()
  userStore.logout()
  router.replace('/login')
}

function rejectQueue(error) {
  queue.forEach(({ reject }) => reject(error))
  queue = []
}

function replayQueue(accessToken) {
  queue.forEach(({ config, resolve, reject }) => {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
    config.__isRetryRequest = true
    service(config).then(resolve).catch(reject)
  })
  queue = []
}

async function refreshAndReplay(originalConfig, error) {
  const userStore = useUserStore()
  if (!userStore.refreshToken || originalConfig.__isRetryRequest) {
    redirectToLogin()
    showError('登录已失效，请重新登录', originalConfig)
    return Promise.reject(error)
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      queue.push({ config: originalConfig, resolve, reject })
    })
  }

  isRefreshing = true
  try {
    const response = await axios.post('/auth/refresh', { refreshToken: userStore.refreshToken }, {
      baseURL: '/api',
      timeout: 15000,
      headers: { 'Content-Type': 'application/json;charset=UTF-8' }
    })
    const payload = response.data
    if (Number(payload?.code) !== 200 || !payload?.data?.accessToken) {
      throw new Error(payload?.message || '登录已失效，请重新登录')
    }

    const { accessToken, refreshToken } = payload.data
    userStore.setTokens(accessToken, refreshToken)
    replayQueue(accessToken)

    originalConfig.headers = originalConfig.headers || {}
    originalConfig.headers.Authorization = `Bearer ${accessToken}`
    originalConfig.__isRetryRequest = true
    return service(originalConfig)
  } catch (refreshError) {
    rejectQueue(refreshError)
    redirectToLogin()
    showError('登录已失效，请重新登录', originalConfig)
    return Promise.reject(refreshError)
  } finally {
    isRefreshing = false
  }
}

service.interceptors.request.use(config => {
  const { token } = useUserStore()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

service.interceptors.response.use(
  response => {
    const payload = response.data
    if (payload && Object.prototype.hasOwnProperty.call(payload, 'code')) {
      if (Number(payload.code) === 200) return payload.data

      const error = new Error(payload.message || '请求失败')
      error.response = response
      showError(error.message, response.config)
      return Promise.reject(error)
    }
    return payload
  },
  error => {
    const { response, config = {} } = error
    if (response?.status === 401 && !config.skipAuthRefresh && !isAuthEndpoint(config.url)) {
      return refreshAndReplay(config, error)
    }

    if (response?.status === 401) showError('登录已失效，请重新登录', config)
    else if (response?.status === 403) showError('无权限访问，若刚分配权限请重新登录后生效', config)
    else if (response?.status === 404) showError('请求的资源不存在(404)，请检查权限或刷新页面', config)
    else showError(response?.status ? `请求错误(${response.status})` : '网络异常', config)
    return Promise.reject(error)
  }
)

export default service
