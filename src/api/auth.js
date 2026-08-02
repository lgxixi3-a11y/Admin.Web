import axios from 'axios'

const service = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' }
})

function unwrap(response) {
  const payload = response.data
  if (payload?.code === 200) return payload.data
  throw new Error(payload?.message || '请求失败')
}

export function login(data) {
  return service.post('/auth/login', data).then(unwrap)
}

export function getUserInfo(token) {
  return service.get('/auth/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  }).then(unwrap)
}
