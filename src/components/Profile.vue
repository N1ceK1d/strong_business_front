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
          <v-tab value="tariff">Тариф</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <v-window-item value="tests">
            <v-card class="mt-4">
              <v-card-title>Доступные тесты</v-card-title>
              <v-card-text>
                <v-alert v-if="hasNoAccess" type="info" class="mb-4">
                  У вас нет доступа к тестам. <a href="#" @click="tab = 'tariff'">Выберите тариф</a> чтобы получить доступ.
                </v-alert>

                <v-list>
                  <v-list-item
                    v-for="test in accessibleTests"
                    :key="test.id"
                    @click="goToTestResults(test.id)"
                    link
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary">
                        <v-icon>mdi-file-document</v-icon>
                      </v-avatar>
                    </template>
                    
                    <template v-slot:title>
                      <div class="d-flex align-center">
                        <span>{{ test.name }}</span>
                        <v-chip size="small" color="primary" class="ml-2">
                          {{ test.questions_count || getDefaultQuestionCount(test.id) }} вопросов
                        </v-chip>
                      </div>
                    </template>
                    
                    <template v-slot:append>
                      <v-btn
                        icon
                        variant="text"
                        @click.stop="toggleTestDescription(test.id)"
                        size="small"
                      >
                        <v-icon>
                          {{ expandedTests.includes(test.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                        </v-icon>
                      </v-btn>
                    </template>
                    
                    <v-expand-transition>
                      <div v-if="expandedTests.includes(test.id)" class="test-description">
                        <v-divider class="my-2"></v-divider>
                        <div class="text-caption text-medium-emphasis">
                          <div class="mb-2">
                            {{ getTestDescription(test.id) }}
                          </div>
                          <div class="d-flex align-center">
                            <v-icon small class="mr-1">mdi-help-circle</v-icon>
                            <strong>Что оценивает:</strong> 
                            <span class="ml-1">{{ getTestAssessment(test.id) }}</span>
                          </div>
                          <div class="d-flex align-center mt-1">
                            <v-icon small class="mr-1">mdi-account-group</v-icon>
                            <strong>Для кого:</strong> 
                            <span class="ml-1">{{ getTestAudience(test.id) }}</span>
                          </div>
                        </div>
                      </div>
                    </v-expand-transition>
                  </v-list-item>

                  <v-list-item
                    v-for="test in inaccessibleTests"
                    :key="'locked-' + test.id"
                    class="locked-test"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="grey-lighten-2">
                        <v-icon color="grey">mdi-lock</v-icon>
                      </v-avatar>
                    </template>
                    
                    <template v-slot:title>
                      <div class="d-flex align-center">
                        <span class="text-grey">{{ test.name }}</span>
                        <v-chip size="small" color="grey" class="ml-2">
                          {{ test.questions_count || getDefaultQuestionCount(test.id) }} вопросов
                        </v-chip>
                      </div>
                    </template>
                    
                    <template v-slot:append>
                      <v-btn
                        color="primary"
                        size="small"
                        @click="tab = 'tariff'"
                      >
                        Разблокировать
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Генератор ссылок (только для доступных тестов) -->
            <v-card v-if="accessibleTests.length > 0" class="mt-4">
              <v-card-title>Генератор уникальной ссылки</v-card-title>
              <v-card-text>
                <v-select
                  v-model="selectedTestId"
                  :items="accessibleTests"
                  item-title="name"
                  item-value="id"
                  label="Выберите тест"
                  class="mb-4"
                >
                  <template v-slot:item="{ props, item }">
                    <v-list-item v-bind="props">
                      <template v-slot:title>
                        <div class="d-flex align-center">
                          <span>{{ item.raw.name }}</span>
                          <v-chip size="small" color="primary" class="ml-2">
                            {{ item.raw.questions_count || getDefaultQuestionCount(item.raw.id) }} вопросов
                          </v-chip>
                        </div>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>
                
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
      isAnonymous: false,
      expandedTests: [],
      userTariff: null
    }
  },
  computed: {
    userFullName() {
      return `${this.user.last_name || ''} ${this.user.first_name || ''} ${this.user.middle_name || ''}`.trim();
    },
    selectedTestAllowsAnonymous() {
      const test = this.tests.find(t => t.id === this.selectedTestId);
      return test?.allow_anonymous || false;
    },
    
    accessibleTests() {
      if (!this.userTariff || !this.userTariff.tests) return [];
      return this.tests.filter(test => this.userTariff.tests.includes(test.id));
    },
    
    inaccessibleTests() {
      if (!this.userTariff || !this.userTariff.tests) return this.tests;
      return this.tests.filter(test => !this.userTariff.tests.includes(test.id));
    },
    
    hasNoAccess() {
      return this.accessibleTests.length === 0 && this.tests.length > 0;
    }
  },
  async created() {
    if (!this.isAuthenticated()) {
      this.$router.push('/login');
      return;
    }
    
    this.loadUserData();
    this.editUser = { ...this.user };
    
    await this.fetchTests();
    await this.loadUserTariff();
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
        const response = await api.get('/get_tests/');
        
        if (response.data && Array.isArray(response.data)) {
          this.tests = response.data.map(test => ({
            ...test,
            questions_count: test.questions_count || this.getDefaultQuestionCount(test.id)
          }));
        } else {
          this.tests = [];
        }
      } catch (error) {
        this.handleApiError(error, 'Ошибка загрузки тестов');
      } finally {
        this.loading = false;
      }
    },
    
    async loadUserTariff() {
  try {
    const response = await api.get('/client/tariffs');
    
    let availableTests = [];
    
    if (response.data && Array.isArray(response.data)) {
      // Предполагаем, что тарифы имеют поле access_type
      // и мы знаем, какие тесты соответствуют каждому типу доступа
      const accessTypeToTests = {
        'candidates': [1, 2, 3],    // Тесты для кандидатов
        'analytics': [4, 5]         // Тесты для аналитики
      };
      
      for (const tariff of response.data) {
        if (new Date(tariff.expiry_date) > new Date() && 
            accessTypeToTests[tariff.access_type]) {
          availableTests.push(...accessTypeToTests[tariff.access_type]);
        }
      }
    }
    
    this.userTariff = { tests: [...new Set(availableTests)] };
    
  } catch (error) {
    console.error('Ошибка загрузки тарифа:', error);
    this.userTariff = { tests: [] };
  }
},
    
    getDefaultQuestionCount(testId) {
      const questionCounts = {
        1: 140,
        2: 85,
        3: 105,
        4: 120,
        5: 95
      };
      return questionCounts[testId] || 0;
    },
    
    getTestDescription(testId) {
      const descriptions = {
        1: 'Сравнительный анализ видения руководителя и сотрудников. Выявление "слепых зон" и точек роста для бизнеса.',
        2: 'Определение ключевых мотиваторов сотрудников. Построение индивидуальных профилей мотивации.',
        3: 'Оценка эмоциональной устойчивости и лидерского потенциала. Прогнозирование поведения в команде.',
        4: 'Анализ профессиональных навыков и soft skills. Создание карты компетенций с зонами развития.',
        5: 'Диагностика групповых процессов и взаимодействия в команде. Рекомендации по улучшению работы.'
      };
      return descriptions[testId] || 'Описание теста';
    },
    
    getTestAssessment(testId) {
      const assessments = {
        1: '14 ключевых критериев: руководство, мотивация, ответственность, вовлеченность, карьерные возможности',
        2: 'Ключевые мотиваторы: деньги, карьера, признание, стабильность, самореализация',
        3: 'Эмоциональную устойчивость, здоровье, честность, ответственность, лидерский потенциал',
        4: 'Профессиональные навыки, soft skills, лидерские качества, аналитические способности',
        5: 'Взаимодействие в команде, распределение ролей, коммуникации, разрешение конфликтов'
      };
      return assessments[testId] || 'Различные аспекты работы и поведения';
    },
    
    getTestAudience(testId) {
      const audiences = {
        1: 'Для руководителей и всей команды',
        2: 'Для всех сотрудников',
        3: 'Для HR и руководителей при найме',
        4: 'Для оценки профессиональных качеств',
        5: 'Для рабочих групп и отделов'
      };
      return audiences[testId] || 'Для сотрудников компании';
    },
    
    toggleTestDescription(testId) {
      const index = this.expandedTests.indexOf(testId);
      if (index > -1) {
        this.expandedTests.splice(index, 1);
      } else {
        this.expandedTests.push(testId);
      }
    },
    
    handleApiError(error, defaultMessage) {
      console.error(defaultMessage, error);
      
      if (error.response?.status === 401) {
        this.showAuthError();
      } else {
        this.errors = error.response?.data?.message || defaultMessage;
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
        Object.assign(this.user, {
          last_name: this.editUser.last_name,
          first_name: this.editUser.first_name,
          middle_name: this.editUser.middle_name,
          email: this.editUser.email,
          phone: this.editUser.phone
        });
        
        const updateData = {
          id: this.user.id,
          last_name: this.editUser.last_name,
          first_name: this.editUser.first_name,
          middle_name: this.editUser.middle_name,
          email: this.editUser.email,
          phone: this.editUser.phone
        };
        
        await api.put('/update_user/',updateData);
        this.updateLocalStorageUserData();
        this.showToast('Изменения сохранены!', 'success');
      } catch (error) {
        this.handleSaveError(error);
      }
    },
    
    handleSaveError(error) {
      console.error('Save error:', error);
      const errorMsg = error.response?.data?.error || 'Ошибка сохранения данных';
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
      
      if (!this.user.company_id) {
        this.showToast('Не найден идентификатор компании', 'error');
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

.test-description {
  padding: 8px 0;
  font-size: 0.875rem;
}

.v-list-item {
  align-items: start;
}

.v-list-item__title {
  white-space: normal;
}

.locked-test {
  opacity: 0.6;
  cursor: not-allowed;
}

.locked-test:hover {
  background-color: transparent;
}
</style>