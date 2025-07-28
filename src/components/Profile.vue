<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title class="text-center">Профиль</v-card-title>
          <v-card-text>
            <div class="text-center mb-4">
              <v-icon
                size="100"
                color="primary"
                class="profile-icon"
              >
                mdi-account-circle
              </v-icon>
            </div>
            
            <v-list lines="two">
              <v-list-item
                prepend-icon="mdi-account"
                :title="`${this.user.last_name} ${this.user.first_name} ${this.user.middle_name}`"
              ></v-list-item>
              
              <v-list-item
                prepend-icon="mdi-email"
                :title="user.email"
                subtitle="Email"
              ></v-list-item>
              
              <v-list-item
                prepend-icon="mdi-phone"
                :title="user.phone"
                subtitle="Телефон"
              ></v-list-item>
              
              <v-list-item
                prepend-icon="mdi-office-building"
                :title="user.company"
                subtitle="Компания"
              ></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-tabs v-model="tab" grow>
          <v-tab value="tests">Мои тесты</v-tab>
          <v-tab value="settings">Настройки</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="tests">
            <v-card class="mt-4">
              <v-card-title>Тесты</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="test in tests"
                    :key="test.id"
                    :title="test.name"
                    @click="goToTestResults(test.id)"
                    link
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary">
                        <v-icon>mdi-file-document</v-icon>
                      </v-avatar>
                    </template>
                    
                    <template v-slot:append>
                      <v-icon>mdi-chevron-right</v-icon>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
<v-card>
    <v-card-title>Генератор уникальной ссылки</v-card-title>
    <v-card-text>
      <v-select
        v-model="selectedTestId"
        :items="tests"
        item-title="name"
        item-value="id"
        label="Выберите тест"
        class="mb-4"
      ></v-select>
      
      <v-checkbox
        v-model="isAnonymous"
        label="Анонимный доступ"
      ></v-checkbox>
      
      <v-text-field
        v-model="generatedLink"
        label="Ваша уникальная ссылка"
        readonly
        outlined
      ></v-text-field>
      
      <v-btn 
        color="primary"
        @click="generateLink"
        :disabled="!selectedTestId"
      >
        Сгенерировать ссылку
      </v-btn>
      
      <v-btn 
        color="secondary"
        @click="copyLink"
        :disabled="!generatedLink"
        class="ml-2"
      >
        Копировать
      </v-btn>
    </v-card-text>
  </v-card>
          </v-window-item>

          <v-window-item value="settings">
            <v-card class="mt-4">
              <v-card-title>Настройки профиля</v-card-title>
              <v-card-text>
                <v-form @submit.prevent="saveProfile">
                  <v-text-field
                    v-model="editUser.fullName"
                    label="ФИО"
                    prepend-icon="mdi-account"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="editUser.email"
                    label="Email"
                    prepend-icon="mdi-email"
                    type="email"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="editUser.phone"
                    label="Телефон"
                    prepend-icon="mdi-phone"
                  ></v-text-field>
                  
                  <v-text-field
                    v-model="editUser.company"
                    label="Компания"
                    prepend-icon="mdi-office-building"
                  ></v-text-field>
                  
                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    class="mt-4"
                  >
                    Сохранить изменения
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from '@/services/api';
import CryptoJS from 'crypto-js';

export default {
  data() {
    return {
      tab: 'tests',
      loading: false,
      tests: [],
      errors: '',
      user: JSON.parse(localStorage.getItem('user_info')),
      editUser: {},
      generatedLink: '',
      secretKey: 't1xvuNj9aGC5TJ19P4EY0uiVRlTSXK4t ',
      selectedTestId: null,
      isAnonymous: false,
    }
  },
  created() {
    this.editUser = { ...this.user };
    this.fetchTests();
  },
  methods: {
    async fetchTests() {
      try {
        this.loading = true;
        const response = await api.get('/get_tests');
        this.tests = response.data;
      } catch (error) {
        this.errors = error;
      } finally {
        this.loading = false;
      }
    },
    goToTestResults(testId) {
      this.$router.push(`/test_results/${testId}`);
    },
    saveProfile() {
      Object.assign(this.user, this.editUser);
      alert('Изменения сохранены!');
    },
    generateLink() {
      if (!this.selectedTestId) return;
      
      const dataToEncrypt = {
        testId: this.selectedTestId,
        isAnonymous: this.isAnonymous,
        timestamp: Date.now()
      };
      
      // Шифруем данные
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(dataToEncrypt),
        this.secretKey
      ).toString();
      
      // Кодируем для URL
      const encodedData = encodeURIComponent(encryptedData);
      
      // Формируем ссылку (замените на ваш домен)
      this.generatedLink = `${window.location.origin}/test-access/${encodedData}`;
    },
    copyLink() {
      if (!this.generatedLink) return;
      
      // Копирование в буфер обмена
      navigator.clipboard.writeText(this.generatedLink)
        .then(() => {
          alert('Ссылка скопирована в буфер обмена!');
        })
        .catch(err => {
          console.error('Ошибка копирования: ', err);
        });
    }
  }
}
</script>

<style scoped>
.profile-icon {
  background-color: #f5f5f5;
  border-radius: 50%;
  padding: 10px;
}
</style>