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
          <v-window-item value="tariff">
            <v-card class="mt-4">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-account-star</v-icon>
                Управление тарифом
              </v-card-title>
              
              <v-card-text>
                <v-alert
                  v-if="activeTariff"
                  :type="tariffAlertType"
                  class="mb-4"
                >
                  <div class="d-flex align-center">
                    <div>
                      <strong>Текущий тариф:</strong> {{ tariffName }}<br>
                      <strong>Срок действия:</strong> до {{ tariffEndDate }}<br>
                      <strong>Осталось:</strong> {{ daysRemaining }} дней
                      <span v-if="hasConsultant"> • С консультантом</span>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="showExtendDialog = true"
                    >
                      Продлить
                    </v-btn>
                  </div>
                </v-alert>

                <v-alert
                  v-else
                  type="warning"
                  class="mb-4"
                >
                  У вас не активирован ни один тариф. Для доступа ко всем функциям системы выберите подходящий тарифный план:
                </v-alert>

                <v-row>
                  <v-col
                    v-for="tariff in tariffs"
                    :key="tariff.id"
                    cols="12"
                    md="4"
                  >
                    <v-card
                      :border="true"
                      :variant="selectedTariffId === tariff.id ? 'outlined' : 'elevated'"
                      :color="selectedTariffId === tariff.id ? 'primary-lighten-5' : ''"
                      @click="selectedTariffId = tariff.id"
                      class="h-100"
                    >
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">{{ tariff.icon }}</v-icon>
                        {{ tariff.name }}
                      </v-card-title>
                      
                      <v-card-subtitle>
                        {{ tariff.description }}
                      </v-card-subtitle>
                      
                      <v-card-text>
                        <v-list density="compact">
                          <v-list-item
                            v-for="feature in tariff.features"
                            :key="feature"
                          >
                            <template v-slot:prepend>
                              <v-icon color="success">mdi-check</v-icon>
                            </template>
                            <v-list-item-title>{{ feature }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                        
                        <div class="text-center mt-4">
                          <div class="text-h5">{{ tariff.price }} ₽</div>
                          <div class="text-caption">за {{ tariff.duration }} дней</div>
                        </div>
                      </v-card-text>
                      
                      <v-card-actions>
                        <v-checkbox
                          v-model="tariff.needConsultant"
                          label="Консультант (+5000 ₽)"
                          density="comfortable"
                          hide-details
                        ></v-checkbox>
                        
                        <v-spacer></v-spacer>
                        
                        <v-btn
                          color="primary"
                          @click.stop="buyTariff(tariff)"
                          :loading="loadingTariffId === tariff.id"
                        >
                          Выбрать
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
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
            <v-card class="mt-4">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-account-star</v-icon>
                Управление тарифом
              </v-card-title>
              
              <v-card-text>
                <v-alert
                  v-if="activeTariff"
                  :type="tariffAlertType"
                  class="mb-4"
                >
                  <div class="d-flex align-center">
                    <div>
                      <strong>Текущий тариф:</strong> {{ tariffName }}<br>
                      <strong>Срок действия:</strong> до {{ tariffEndDate }}<br>
                      <strong>Осталось:</strong> {{ daysRemaining }} дней
                      <span v-if="hasConsultant"> • С консультантом</span>
                    </div>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      variant="outlined"
                      size="small"
                      @click="showExtendDialog = true"
                    >
                      Продлить
                    </v-btn>
                  </div>
                </v-alert>

                <v-alert
                  v-else
                  type="warning"
                  class="mb-4"
                >
                  У вас не активирован ни один тариф. Для доступа ко всем функциям системы выберите подходящий тарифный план:
                </v-alert>

                <!-- Блок консультанта -->
                <v-card class="mb-6" v-if="!hasConsultant">
                  <v-card-title class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-account-tie</v-icon>
                    Помощь консультанта
                  </v-card-title>
                  <v-card-text>
                    <p class="mb-4">Наши эксперты помогут вам:</p>
                    <v-list>
                      <v-list-item
                        v-for="(benefit, i) in consultantBenefits"
                        :key="i"
                        prepend-icon="mdi-check"
                      >
                        {{ benefit }}
                      </v-list-item>
                    </v-list>
                    <v-checkbox
                      v-model="needConsultant"
                      label="Добавить консультанта (+5000 ₽/мес)"
                      class="mt-4"
                    ></v-checkbox>
                  </v-card-text>
                </v-card>

                <!-- Тарифные планы -->
                <v-row>
                  <v-col
                    v-for="tariff in tariffs"
                    :key="tariff.id"
                    cols="12"
                    md="4"
                  >
                    <v-card
                      :border="true"
                      :variant="selectedTariffId === tariff.id ? 'outlined' : 'elevated'"
                      :color="selectedTariffId === tariff.id ? 'primary-lighten-5' : ''"
                      @click="selectedTariffId = tariff.id"
                      class="h-100"
                    >
                      <v-card-title class="d-flex align-center">
                        <v-icon class="mr-2">{{ tariff.icon }}</v-icon>
                        {{ tariff.name }}
                      </v-card-title>
                      
                      <v-card-subtitle>
                        {{ tariff.description }}
                      </v-card-subtitle>
                      
                      <v-card-text>
                        <v-list density="compact">
                          <v-list-item
                            v-for="feature in tariff.features"
                            :key="feature"
                          >
                            <template v-slot:prepend>
                              <v-icon color="success">mdi-check</v-icon>
                            </template>
                            <v-list-item-title>{{ feature }}</v-list-item-title>
                          </v-list-item>
                        </v-list>
                        
                        <div class="text-center mt-4">
                          <div class="text-h5">{{ tariff.price }} ₽</div>
                          <div class="text-caption">за {{ tariff.duration }} дней</div>
                        </div>
                      </v-card-text>
                      
                      <v-card-actions>
                        <v-btn
                          color="primary"
                          @click.stop="buyTariff(tariff)"
                          :loading="loadingTariffId === tariff.id"
                          block
                        >
                          Выбрать
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Диалог продления -->
                <v-dialog v-model="showExtendDialog" max-width="500">
                  <v-card>
                    <v-card-title>Продление тарифа</v-card-title>
                    <v-card-text>
                      <v-select
                        v-model="extendPeriod"
                        :items="extendOptions"
                        label="Период продления"
                        class="mb-4"
                      ></v-select>
                      
                      <div class="text-h6 text-center">
                        Итого к оплате: {{ extendPrice }} ₽
                      </div>
                    </v-card-text>
                    
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn color="grey" @click="showExtendDialog = false">Отмена</v-btn>
                      <v-btn color="primary" @click="extendTariff">Продлить</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
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
      testsWithAnonymous: [],
      selectedTariffId: null,
      showExtendDialog: false,
      tariffs: [
        {
          id: 1,
          name: 'Базовый',
          description: 'Доступ к основным тестам',
          price: 5000,
          duration: 30,
          max_users: 10,
          has_analytics: false,
          allow_anonymous: false,
          has_support: false,
          icon: 'mdi-account'
        },
        {
          id: 2,
          name: 'Профессиональный',
          description: 'Расширенная аналитика и отчеты',
          price: 10000,
          duration: 30,
          max_users: 50,
          has_analytics: true,
          allow_anonymous: true,
          has_support: false,
          icon: 'mdi-account-supervisor'
        },
        {
          id: 3,
          name: 'Корпоративный',
          description: 'Полный доступ для всей компании',
          price: 25000,
          duration: 30,
          max_users: 200,
          has_analytics: true,
          allow_anonymous: true,
          has_support: true,
          icon: 'mdi-account-group'
        }
      ],
      consultantBenefits: [
        'Помощь в интерпретации результатов',
        'Персональные рекомендации',
        'Консультации по развитию сотрудников',
        'Поддержка по email и телефону'
      ],
      needConsultant: false,
      selectedTariffId: null,
      loadingTariffId: null,
      activeTariff: null,
      showExtendDialog: false,
      extendPeriod: 30,
      extendOptions: [
        { title: '1 месяц', value: 30 },
        { title: '3 месяца', value: 90 },
        { title: '6 месяца', value: 180 },
        { title: '1 год', value: 365 }
      ]
    }
  },
  created() {
    this.editUser = { ...this.user };
    this.fetchTests();
  },
  computed: {
    userFullName() {
      return `${this.user.last_name || ''} ${this.user.first_name || ''} ${this.user.middle_name || ''}`.trim();
    },
    
    hasActiveTariff() {
      return this.activeTariff && new Date(this.activeTariff.end_date) > new Date();
    },
    
    tariffName() {
      if (!this.activeTariff) return 'Не активен';
      return this.activeTariff.tariff?.name || 'Неизвестный тариф';
    },
    
    tariffStatus() {
      if (!this.activeTariff) return 'Тариф не активирован';
      return this.hasActiveTariff ? 'Активен' : 'Истек';
    },
    
    tariffColor() {
      if (!this.activeTariff) return 'grey';
      return this.hasActiveTariff ? 'green' : 'red';
    },
    
    tariffEndDate() {
      if (!this.activeTariff) return '';
      return new Date(this.activeTariff.end_date).toLocaleDateString();
    },
    
    daysRemaining() {
      if (!this.activeTariff) return 0;
      const end = new Date(this.activeTariff.end_date);
      const now = new Date();
      return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    },
    
    tariffAlertType() {
      if (!this.activeTariff) return 'warning';
      if (this.daysRemaining > 7) return 'info';
      if (this.daysRemaining > 3) return 'warning';
      return 'error';
    },
    
    hasConsultant() {
      return this.activeTariff?.has_consultant;
    },
    
    extendPrice() {
      if (!this.activeTariff) return 0;
      const basePrice = this.activeTariff.tariff.price;
      const consultantFee = this.hasConsultant ? 5000 : 0;
      return Math.round((basePrice * this.extendPeriod / 30) + consultantFee);
    },
    selectedTestAllowsAnonymous() {
      if (!this.selectedTestId) return false;
      const test = this.tests.find(t => t.id === this.selectedTestId);
      return test ? test.allow_anonymous : false;
    }
  },
  methods: {
    async loadData() {
      try {
        const [tariffsRes, testsRes, activeTariffRes] = await Promise.all([
          api.get('/tariffs'),
          api.get('/tests'),
          api.get('/user/tariff/active')
        ]);
        
        this.tariffs = tariffsRes.data.map(t => ({
          ...t,
          icon: this.getTariffIcon(t.id),
          needConsultant: false,
          features: [
            `До ${t.max_users} пользователей`,
            t.has_analytics && 'Расширенная аналитика',
            t.allow_anonymous && 'Анонимный доступ',
            t.has_support && 'Приоритетная поддержка'
          ].filter(Boolean)
        }));
        
        this.availableTests = testsRes.data;
        this.activeTariff = activeTariffRes.data;
        
        if (this.activeTariff && this.hasActiveTariff) {
          this.tab = 'tests';
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      }
    },
    
    getTariffIcon(tariffId) {
      const icons = {
        1: 'mdi-account',
        2: 'mdi-account-supervisor',
        3: 'mdi-account-group'
      };
      return icons[tariffId] || 'mdi-account';
    },

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
    async saveProfile() {
      Object.assign(this.user, this.editUser);
      try {
        this.updateLocalStorageUserData(this.editUser);
        const response = await api.put('/update_user', this.editUser);
      } catch (error) {
        console.error(error);
      }
      alert('Изменения сохранены!');
    },
    updateLocalStorageUserData(newData) {
      const ls_data = JSON.parse(localStorage.getItem('user_info'));
      ls_data.first_name = this.editUser.first_name;
      ls_data.last_name = this.editUser.last_name;
      ls_data.middle_name = this.editUser.middle_name;
      ls_data.email = this.editUser.email;
      ls_data.phone = this.editUser.phone;
      localStorage.setItem('user_info', JSON.stringify(ls_data));
    },
    generateLink() {
      if (!this.selectedTestId) return;
      
      // Если выбран анонимный доступ, но тест его не поддерживает
      if (this.isAnonymous && !this.selectedTestAllowsAnonymous) {
        this.isAnonymous = false; // Сбрасываем анонимность
      }
      
      const dataToEncrypt = {
        testId: this.selectedTestId,
        companyId: this.user.company_id,
        isAnonymous: this.isAnonymous && this.selectedTestAllowsAnonymous, // Двойная проверка
        timestamp: Date.now()
      };
      
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(dataToEncrypt),
        this.secretKey
      ).toString();
      
      this.generatedLink = `${window.location.origin}/test-access/${encodeURIComponent(encryptedData)}`;
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
.h-100 {
  height: 100%;
}
.primary-lighten-5 {
  background-color: rgba(var(--v-theme-primary), 0.05);
}
</style>