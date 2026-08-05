import { defineStore } from 'pinia'
import { getUserInfo } from '@/api/auth'
import { usePermissionStore } from '@/stores/permission'
import { normalizeUserInfo } from '@/utils/user-info-utils.mjs'

const TOKEN_KEY = 'admin-token'
const REFRESH_TOKEN_KEY = 'admin-refresh-token'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || '',
    rememberMe: Boolean(localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)),
    userInfo: null,
    roles: [],
    perms: [],
    menus: []
  }),
  actions: {
    setTokens(accessToken, refreshToken, rememberMe = false) {
      this.token = accessToken || ''
      this.refreshToken = refreshToken || ''
      this.rememberMe = Boolean(rememberMe)

      const storage = rememberMe ? localStorage : sessionStorage
      const clearStorage = rememberMe ? sessionStorage : localStorage

      if (this.token) storage.setItem(TOKEN_KEY, this.token)
      else storage.removeItem(TOKEN_KEY)

      if (this.refreshToken) storage.setItem(REFRESH_TOKEN_KEY, this.refreshToken)
      else storage.removeItem(REFRESH_TOKEN_KEY)

      clearStorage.removeItem(TOKEN_KEY)
      clearStorage.removeItem(REFRESH_TOKEN_KEY)
    },
    async getInfo() {
      if (!this.token) throw new Error('登录凭证不存在')

      const data = await getUserInfo(this.token)
      this.userInfo = normalizeUserInfo(data)
      this.roles = data.roles || []
      this.perms = data.perms || []
      this.menus = data.menus || []
      return data
    },
    logout() {
      this.setTokens('', '', false)
      this.userInfo = null
      this.roles = []
      this.perms = []
      this.menus = []
      usePermissionStore().resetRoutes()
    }
  }
})
