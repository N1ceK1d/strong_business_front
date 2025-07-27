import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false,
    user: null
  }),
  actions: {
    login(userData) {
      this.isAuthenticated = true
      this.user = userData
      localStorage.setItem('auth', 'true')
    },
    logout() {
      this.isAuthenticated = false
      this.user = null
      localStorage.removeItem('auth')
    },
    initialize() {
      if (localStorage.getItem('auth')) {
        this.isAuthenticated = true
      }
    }
  }
})