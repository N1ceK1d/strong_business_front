<template>
  <v-app-bar color="primary" prominent>
    <v-app-bar-nav-icon variant="text" @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
    <v-toolbar-title>Сильный бизнес</v-toolbar-title>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" temporary>
    <v-list>
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        :prepend-icon="item.icon"
        :title="item.title"
        :value="item.title"
        :to="item.link"
        @click="item.title === 'Выйти' ? logout() : null"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useAuthStore } from '@/store/auth';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();
const drawer = ref(false);

const navItems = [
  { title: 'Профиль', icon: 'mdi-home', link: '/profile' },
  { title: 'Выйти', icon: 'mdi-logout', link: '#' } // link можно оставить как # или удалить
];

const logout = () => {
  authStore.logout();
  router.push('/authorization');
  drawer.value = false; // Закрываем меню после выхода
};
</script>