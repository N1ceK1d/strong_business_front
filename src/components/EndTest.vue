<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6 text-center">
          <v-icon color="success" size="80" class="mb-4">mdi-check-circle</v-icon>
          <h1 class="text-h4 mb-4">Тест завершён!</h1>
          <p class="text-body-1 mb-6">
            Спасибо, что прошли наш тест.
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
</style>