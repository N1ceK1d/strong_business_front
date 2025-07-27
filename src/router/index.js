import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import Profile from '@/components/Profile.vue'
import Authorization from '@/components/Authorization.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/components/Home.vue'),
    meta: { requiresAuth: false }
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
    meta: { requiresAuth: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Инициализируем состояние при первом переходе
  if (!authStore.initialized) {
    authStore.initialize()
    authStore.initialized = true
  }

  // Перенаправление для корневого пути
  if (to.path === '/') {
    return next(authStore.isAuthenticated ? '/profile' : '/authorization')
  }

  // Проверка защищенных маршрутов
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next('/authorization')
  }

  // Проверка для уже авторизованных пользователей
  if ((to.path === '/authorization' || to.path === '/login') && authStore.isAuthenticated) {
    return next('/profile')
  }

  next()
})

export default router