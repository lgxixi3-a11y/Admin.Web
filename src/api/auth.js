import service from './http'

export function login(data) {
  return service.post('/auth/login', data, { skipAuthRefresh: true })
}

export function refresh(data) {
  return service.post('/auth/refresh', data, { skipAuthRefresh: true })
}

export function getUserInfo() {
  return service.get('/auth/userinfo')
}

export function logoutApi() {
  return service.post('/auth/logout', null, { silent: true })
}
