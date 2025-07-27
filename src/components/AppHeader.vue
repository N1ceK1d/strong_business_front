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
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref } from 'vue';

const drawer = ref(false);
const navItems = [
  { title: 'Главная', icon: 'mdi-home' },
  { title: 'О нас', icon: 'mdi-information' },
  { title: 'Контакты', icon: 'mdi-email' },
  {title: 'Войти', icon: 'mdi-login'}
];
</script>