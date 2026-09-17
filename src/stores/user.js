import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userId: null,
    username: '',
    realName: '',
    avatar: '',
    signature: '',
    roles: []
  }),
  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.roles && state.roles.includes('admin')
  },
  actions: {
    async login(loginForm) {
      const res = await authApi.login(loginForm)
      this.token = res.data.accessToken
      this.userId = res.data.id
      this.username = res.data.username
      this.realName = res.data.realName
      this.roles = res.data.roles || []
      localStorage.setItem('token', this.token)
      localStorage.setItem('userId', this.userId)
      localStorage.setItem('username', this.username)
      localStorage.setItem('realName', this.realName || '')
      localStorage.setItem('roles', JSON.stringify(this.roles))
      return res
    },
    async register(form) {
      return authApi.register(form)
    },
    // TODO 临时放行（开发调试用）：admin 本地直通，上线前移除
    devLogin() {
      this.token = 'dev-admin-token'
      this.userId = '1'
      this.username = 'admin'
      this.realName = '超级管理员'
      this.roles = ['admin']
      localStorage.setItem('token', this.token)
      localStorage.setItem('userId', this.userId)
      localStorage.setItem('username', this.username)
      localStorage.setItem('realName', this.realName)
      localStorage.setItem('roles', JSON.stringify(this.roles))
    },
    async fetchUserInfo() {
      try {
        const res = await authApi.userDetail()
        this.userId = res.data.userId
        this.username = res.data.username
        this.realName = res.data.realName
        this.avatar = res.data.avatar
        this.roles = res.data.roles || []
      } catch (e) {
        // ignore
      }
    },
    // 更新头像/签名(由个人中心编辑资料后调用)
    setProfileInfo({ avatar, signature } = {}) {
      if (avatar !== undefined) this.avatar = avatar
      if (signature !== undefined) this.signature = signature
    },
    restoreFromStorage() {
      this.userId = localStorage.getItem('userId')
      this.username = localStorage.getItem('username') || ''
      this.realName = localStorage.getItem('realName') || ''
      this.avatar = localStorage.getItem('avatar') || ''
      const rolesStr = localStorage.getItem('roles')
      this.roles = rolesStr ? JSON.parse(rolesStr) : []
    },
    logout() {
      if (this.token) {
        authApi.logout().catch(() => {})
      }
      this.token = ''
      this.userId = null
      this.username = ''
      this.realName = ''
      this.avatar = ''
      this.signature = ''
      this.roles = []
      localStorage.clear()
    }
  }
})
