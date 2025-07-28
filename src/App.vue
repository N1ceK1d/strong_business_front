<template>
  <v-app>
    <AppHeader v-if="$route.meta.showHeaderFooter !== false"/>
    <v-main>
      <router-view></router-view>
    </v-main>
    <AppFooter v-if="$route.meta.showHeaderFooter !== false"/>
  </v-app>
</template>