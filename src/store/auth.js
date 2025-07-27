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
    setUser({ commit }, userData) {
      commit('SET_USER', userData);
      this.isAuthenticated = true;
      console.log('User set in store:', userData); // Для отладки
    },
    initialize() {
      const token = localStorage.getItem('authToken');
      if (token) {
        this.isAuthenticated = true;
        console.log('Initialized with token'); // Для отладки
      }
      this.initialized = true;
    }
  }
})