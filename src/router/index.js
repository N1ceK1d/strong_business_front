import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import Profile from '@/components/Profile.vue'
import Authorization from '@/components/Authorization.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/components/Home.vue'),
    meta: { 
      requiresAuth: false,
      showHeaderFooter: false, }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/authorization',
    name: 'Authorization',
    component: Authorization,
    meta: { 
      requiresAuth: false,
      showHeaderFooter: false, }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.initialize()
  
  // Для корневого пути
  if (to.path === '/') {
    return authStore.isAuthenticated ? '/profile' : '/authorization'
  }
  
  // Защищенные маршруты
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/authorization'
  }
  
  // Запрет доступа к auth-страницам для авторизованных
  if (['/authorization'].includes(to.path) && authStore.isAuthenticated) {
    return '/profile'
  }
})

export default router