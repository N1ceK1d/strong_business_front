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
                :title="userFullName"
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
          <v-tab value="tariff">
            Тариф
          </v-tab>
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
                  :disabled="!selectedTestAllowsAnonymous"
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
                  <v-row class="px-2">
                    <v-text-field
                      v-model="editUser.last_name"
                      label="Фамилия"
                      class="mx-1 p-1"
                      prepend-icon="mdi-account"
                    ></v-text-field>
                    <v-text-field
                      v-model="editUser.first_name"
                      label="Имя"
                      class="mx-1 p-1"
                    ></v-text-field>
                    <v-text-field
                      v-model="editUser.middle_name"
                      label="Отчество"
                      class="mx-1 p-1"
                    ></v-text-field>
                  </v-row>
                 
                  
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
          <v-window-item value="tariff">
              <Access/>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import api from '@/services/api';
import CryptoJS from 'crypto-js';
import Access from './Access.vue';

export default {
  components: {
    Access
  },
  data() {
    return {
      tab: 'tests',
      loading: false,
      tests: [],
      errors: '',
      user: {},
      editUser: {},
      generatedLink: '',
      secretKey: 't1xvuNj9aGC5TJ19P4EY0uiVRlTSXK4t ',
      selectedTestId: null,
      isAnonymous: false
    }
  },
  computed: {
    userFullName() {
      return `${this.user.last_name || ''} ${this.user.first_name || ''} ${this.user.middle_name || ''}`.trim();
    },
    selectedTestAllowsAnonymous() {
      const test = this.tests.find(t => t.id === this.selectedTestId);
      return test?.allow_anonymous || false;
    }
  },
  async created() {
    // Проверяем аутентификацию
    if (!this.isAuthenticated()) {
      this.$router.push('/login');
      return;
    }
    
    this.loadUserData();
    this.editUser = { ...this.user };
    
    await this.fetchTests();
  },
  methods: {
    isAuthenticated() {
      return !!localStorage.getItem('token');
    },
    
    loadUserData() {
      try {
        const userData = localStorage.getItem('user_info');
        if (userData) {
          this.user = JSON.parse(userData);
        } else {
          console.warn('Данные пользователя не найдены в localStorage');
          this.user = {};
        }
      } catch (e) {
        console.error('Ошибка чтения данных пользователя:', e);
        this.user = {};
      }
    },
    
    async fetchTests() {
      try {
        this.loading = true;
        const response = await api.get('/get_tests');
        
        // Проверяем наличие данных
        if (response.data && Array.isArray(response.data)) {
          this.tests = response.data;
        } else {
          this.tests = [];
        }
      } catch (error) {
        this.handleApiError(error, 'Ошибка загрузки тестов');
      } finally {
        this.loading = false;
      }
    },
    
    handleApiError(error, defaultMessage) {
      console.error(defaultMessage, error);
      
      if (error.isAuthError) {
        this.showAuthError();
      } else {
        this.errors = error.response?.data?.message || 
                     defaultMessage;
      }
    },
    
    showAuthError() {
      this.$toast.error('Сессия истекла. Пожалуйста, войдите снова');
      setTimeout(() => {
        this.$router.push('/login');
      }, 3000);
    },
    
    goToTestResults(testId) {
      this.$router.push(`/test_results/${testId}`);
    },
    
    async saveProfile() {
      try {
        // Обновляем только необходимые поля
        Object.assign(this.user, {
          last_name: this.editUser.last_name,
          first_name: this.editUser.first_name,
          middle_name: this.editUser.middle_name,
          email: this.editUser.email,
          phone: this.editUser.phone
        });
        
        // Отправляем только необходимые данные
        const updateData = {
          id: this.user.id,
          last_name: this.editUser.last_name,
          first_name: this.editUser.first_name,
          middle_name: this.editUser.middle_name,
          email: this.editUser.email,
          phone: this.editUser.phone
        };
        
        await api.put('/update_user', updateData);
        
        // Обновляем хранилище после успешного обновления
        this.updateLocalStorageUserData();
        
        this.showToast('Изменения сохранены!', 'success');
      } catch (error) {
        this.handleSaveError(error);
      }
    },
    
    handleSaveError(error) {
      console.error('Save error:', error);
      const errorMsg = error.response?.data?.error || 
                      'Ошибка сохранения данных';
      
      this.showToast(errorMsg, 'error');
    },
    
    updateLocalStorageUserData() {
      try {
        localStorage.setItem('user_info', JSON.stringify(this.user));
      } catch (e) {
        console.error('Ошибка записи в localStorage:', e);
        this.showToast('Ошибка сохранения данных', 'error');
      }
    },
    
    generateLink() {
      if (!this.selectedTestId) {
        this.showToast('Выберите тест', 'error');
        return;
      }
      
      // Проверяем наличие company_id
      if (!this.user.company_id) {
        this.showToast('Не найден идентификатор компании', 'error');
        console.error('Company ID is missing');
        return;
      }
      
      const dataToEncrypt = {
        testId: this.selectedTestId,
        companyId: this.user.company_id,
        isAnonymous: this.isAnonymous && this.selectedTestAllowsAnonymous,
        timestamp: Date.now()
      };
      
      try {
        const encryptedData = CryptoJS.AES.encrypt(
          JSON.stringify(dataToEncrypt),
          this.secretKey
        ).toString();
        
        this.generatedLink = `${window.location.origin}/test-access/${encodeURIComponent(encryptedData)}`;
      } catch (e) {
        console.error('Ошибка шифрования данных:', e);
        this.showToast('Ошибка генерации ссылки', 'error');
      }
    },
    
    copyLink() {
      if (!this.generatedLink) return;
      
      navigator.clipboard.writeText(this.generatedLink)
        .then(() => {
          this.showToast('Ссылка скопирована!', 'success');
        })
        .catch(err => {
          console.error('Ошибка копирования:', err);
          this.showToast('Не удалось скопировать ссылку', 'error');
        });
    },
    
    showToast(message, type = 'info') {
      if (this.$toast) {
        if (type === 'error') {
          this.$toast.error(message);
        } else if (type === 'success') {
          this.$toast.success(message);
        } else {
          this.$toast.info(message);
        }
      } else {
        console.log(`${type.toUpperCase()}: ${message}`);
      }
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