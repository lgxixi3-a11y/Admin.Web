import { defineStore } from 'pinia'
import { getUserInfo } from '@/api/auth'
import { usePermissionStore } from '@/stores/permission'

const TOKEN_KEY = 'admin-token'
const REFRESH_TOKEN_KEY = 'admin-refresh-token'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
    userInfo: null,
    roles: [],
    perms: [],
    menus: []
  }),
  actions: {
    setTokens(accessToken, refreshToken) {
      this.token = accessToken || ''
      this.refreshToken = refreshToken || ''

      if (this.token) localStorage.setItem(TOKEN_KEY, this.token)
      else localStorage.removeItem(TOKEN_KEY)

      if (this.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, this.refreshToken)
      else localStorage.removeItem(REFRESH_TOKEN_KEY)
    },
    async getInfo() {
      if (!this.token) throw new Error('登录凭证不存在')

      const data = await getUserInfo(this.token)
      this.userInfo = {
        userId: data.userId,
        userName: data.userName,
        nickName: data.nickName,
        avatar: data.avatar
      }
      this.roles = data.roles || []
      this.perms = data.perms || []
      this.menus = data.menus || []
      return data
    },
    logout() {
      this.setTokens('', '')
      this.userInfo = null
      this.roles = []
      this.perms = []
      this.menus = []
      usePermissionStore().resetRoutes()
    }
  }
})
