<template>
  <v-footer color="primary" height="auto" class="py-3">
    <v-container class="px-0" fluid>
      <v-row justify="center" no-gutters>
        <v-col cols="12" class="text-center">
          <div class="d-flex flex-wrap justify-center align-center gap-2 mb-2">
            <!-- VK -->
            <v-btn
              icon
              variant="text"
              color="white"
              size="x-small"
              href="https://vk.com/strongbussiness"
              target="_blank"
            >
              <v-icon>mdi-vk</v-icon>
            </v-btn>

            <!-- Website -->
            <v-btn
              variant="text"
              color="white"
              size="x-small"
              href="https://personal-sistem.ru/"
              target="_blank"
              class="px-1"
            >
              <v-icon left>mdi-web</v-icon>
              <span class="text-caption">Сайт</span>
            </v-btn>

            <!-- Telegram -->
            <v-btn
              icon
              variant="text"
              color="white"
              size="x-small"
              href="https://t.me/silny_businesss"
              target="_blank"
            >
              <v-icon>mdi-telegram</v-icon>
            </v-btn>

            <!-- Phone -->
            <v-btn
              variant="text"
              color="white"
              size="x-small"
              href="tel:79872539835"
              class="px-1"
            >
              <v-icon left>mdi-phone</v-icon>
              <span class="text-caption">+7 (987) 253-98-35</span>
            </v-btn>

            <!-- Email -->
            <v-btn
              variant="text"
              color="white"
              size="x-small"
              href="mailto:strongbussiness@mail.ru"
              class="px-1"
            >
              <v-icon left>mdi-email</v-icon>
              <span class="text-caption">Email</span>
            </v-btn>
          </div>

          <div class="text-white text-caption">
            © {{ new Date().getFullYear() }} Strong Business
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup>
// Никаких импортов не требуется
</script>

<style scoped>
/* Дополнительные стили не требуются */
</style>