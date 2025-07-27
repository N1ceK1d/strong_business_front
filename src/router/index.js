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
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  try {
    // Инициализация только если не выполнена
    if (!authStore.initialized) {
      await authStore.initialize();
    }

    // Для корневого пути
    if (to.path === '/') {
      return next(authStore.isAuthenticated ? '/profile' : '/authorization');
    }

    // Разрешить переход если:
    // - маршрут не требует авторизации
    // - пользователь авторизован
    if (!to.meta.requiresAuth || authStore.isAuthenticated) {
      return next();
    }

    // Перенаправление для неавторизованных
    if (!authStore.isAuthenticated && to.meta.requiresAuth) {
      return next('/authorization');
    }

    next();
  } catch (error) {
    console.error('Navigation guard error:', error);
    next('/authorization'); // Фолбэк
  }
});

export default router