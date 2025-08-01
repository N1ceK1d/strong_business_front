import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import Profile from '@/components/Profile.vue'
import Authorization from '@/components/Authorization.vue'
import Test from '@/components/Test.vue'
import TestAccess from '@/components/TestAccess.vue'
import TestOCA from '@/components/test_results/TestOCA.vue'
import ToneScale from '@/components/test_results/ToneScale.vue'
import IQTest from '@/components/test_results/IQTest.vue'
import TestMotivation from '@/components/test_results/TestMotivation.vue'
import TestPotential from '@/components/test_results/TestPotential.vue'
import TestResults from '@/components/TestResults.vue'

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
  },
  {
    path: '/test/:test_data',
    name: 'Test',
    component: Test,
    meta: { 
      requiresAuth: false,
      showHeaderFooter: false, }
  },
  {
    path: '/test-access/:data',
    name: 'TestAccess',
    component: TestAccess,
    meta: { 
        requiresAuth: false,
        showHeaderFooter: false, }
  }, 
  {
    path: '/test_results/:test_id',
    name: 'TestResults',
    component: TestResults,
    meta: { 
      requiresAuth: true,
      showHeaderFooter: true
    },
    props: true // Передаем параметры маршрута как props
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