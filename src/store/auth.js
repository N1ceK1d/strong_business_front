import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    _initialized: false
  }),
  actions: {
    async initialize() {
      if (this._initialized) return
      
      const token = localStorage.getItem('token')
      if (token) {
        try {
          this.isAuthenticated = true
        } catch {
          this.logout()
        }
      }
      this._initialized = true
    },
    setAuth(token, user) {
      localStorage.setItem('token', token)
      this.user = user
      this.isAuthenticated = true
    },
    logout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user_info')
      this.user = null
      this.isAuthenticated = false
    }
  }
})