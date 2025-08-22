<template>
  <v-container class="py-8">
    <v-card elevation="5" rounded="lg">
      <v-card-title class="text-h5 font-weight-bold primary--text">
        <v-icon large class="mr-3">mdi-account-star</v-icon>
        Управление тарифным доступом
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pa-6">
        <v-alert v-if="!hasActiveTariff" type="warning" prominent class="mb-6">
          <template v-slot:prepend>
            <v-icon large>mdi-alert-circle</v-icon>
          </template>
          <h3 class="text-h6 mb-2">У вас не активирован тариф</h3>
          <p class="mb-0">Выберите нужные вам функции:</p>
          <v-chip-group class="mt-3">
            <v-chip color="indigo" dark @click="scrollTo('candidates')">
              <v-icon left>mdi-account-search</v-icon>
              Тестирование
            </v-chip>
            <v-chip color="teal" dark @click="scrollTo('analytics')">
              <v-icon left>mdi-chart-bar</v-icon>
              Аналитика
            </v-chip>
          </v-chip-group>
        </v-alert>

        <v-alert v-else type="info" prominent class="mb-6">
          <template v-slot:prepend>
            <v-icon large>mdi-check-circle</v-icon>
          </template>
          <h3 class="text-h6 mb-2">Активный тариф</h3>
          <p class="mb-0">Действует до: {{ activeTariff.expiry_date }}</p>
        </v-alert>

        <v-btn color="primary" large @click="dialog = true">
          <v-icon left>mdi-cart</v-icon>
          {{ hasActiveTariff ? 'Изменить тарифы' : 'Выбрать тарифы' }}
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Диалог выбора тарифов -->
    <v-dialog v-model="dialog" max-width="900" scrollable>
      <v-card>
        <v-toolbar color="primary" dark>
          <v-toolbar-title>Настройте ваш доступ</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="dialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        
        <v-card-text class="pa-6">
          <!-- Выбор тестирования -->
          <v-card id="candidates" class="mb-6" elevation="3">
            <v-card-title class="d-flex align-center">
              <v-checkbox
                v-model="selectedAccess.candidates"
                color="indigo"
                hide-details
                class="mr-3"
              ></v-checkbox>
              <v-icon large color="indigo" class="mr-3">mdi-account-search</v-icon>
              <span>Тестирование кандидатов</span>
              <v-spacer></v-spacer>
              <v-chip color="indigo" dark v-if="selectedAccess.candidates">
                Выбрано
              </v-chip>
            </v-card-title>
            
            <v-expand-transition>
              <div v-if="selectedAccess.candidates">
                <v-divider class="mx-4"></v-divider>
                <v-card-text>
                  <p class="mb-4">Оценка навыков и компетенций соискателей</p>
                  
                  <v-radio-group v-model="selectedTariff.candidates" column>
                    <v-radio
                      v-for="tariff in candidateTariffs"
                      :key="tariff.id"
                      :value="tariff"
                      color="indigo"
                    >
                      <template v-slot:label>
                        <div class="d-flex align-center">
                          <div>
                            <strong>{{ tariff.title }}</strong>
                            <div class="text-caption">{{ tariff.description }}</div>
                          </div>
                          <v-spacer></v-spacer>
                          <v-chip color="indigo" dark>
                            {{ tariff.price }} ₽
                          </v-chip>
                        </div>
                      </template>
                    </v-radio>
                  </v-radio-group>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
          
          <!-- Выбор аналитики -->
          <v-card id="analytics" elevation="3">
            <v-card-title class="d-flex align-center">
              <v-checkbox
                v-model="selectedAccess.analytics"
                color="teal"
                hide-details
                class="mr-3"
              ></v-checkbox>
              <v-icon large color="teal" class="mr-3">mdi-chart-bar</v-icon>
              <span>Анализ персонала</span>
              <v-spacer></v-spacer>
              <v-chip color="teal" dark v-if="selectedAccess.analytics">
                Выбрано
              </v-chip>
            </v-card-title>
            
            <v-expand-transition>
              <div v-if="selectedAccess.analytics">
                <v-divider class="mx-4"></v-divider>
                <v-card-text>
                  <p class="mb-4">Комплексная оценка сотрудников компании</p>
                  
                  <v-radio-group v-model="selectedTariff.analytics" column>
                    <v-radio
                      v-for="tariff in analyticsTariffs"
                      :key="tariff.id"
                      :value="tariff"
                      color="teal"
                    >
                      <template v-slot:label>
                        <div class="d-flex align-center">
                          <div>
                            <strong>{{ tariff.title }}</strong>
                            <div class="text-caption">{{ tariff.description }}</div>
                          </div>
                          <v-spacer></v-spacer>
                          <v-chip color="teal" dark>
                            {{ tariff.price }} ₽
                          </v-chip>
                        </div>
                      </template>
                    </v-radio>
                  </v-radio-group>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
          
          <!-- Итоговая сумма -->
          <v-card class="mt-6" color="grey lighten-4" flat>
            <v-card-text class="d-flex align-center">
              <div>
                <div class="text-h6">Итого к оплате:</div>
                <div class="text-caption">Вы выбрали {{ selectedCount }} {{ tariffWordForm }}</div>
              </div>
              <v-spacer></v-spacer>
              <div class="text-h4 primary--text">
                {{ totalPrice }} ₽
              </div>
            </v-card-text>
          </v-card>
        </v-card-text>
        
        <v-card-actions class="pa-6">
          <v-btn text @click="dialog = false">Отмена</v-btn>
          <v-spacer></v-spacer>
          <v-btn 
            color="success" 
            x-large
            :disabled="!isPaymentReady"
            @click="processPayment"
            :loading="loading"
            class="elevation-6 font-weight-bold payment-button"
            dark
          >
            <v-icon left>mdi-credit-card</v-icon>
            Перейти к оплате
            <v-icon right v-if="isPaymentReady">mdi-arrow-right</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Диалог авторизации -->
    <v-dialog v-model="authDialog" max-width="500" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon color="warning" large class="mr-2">mdi-alert</v-icon>
          Требуется авторизация
        </v-card-title>
        <v-card-text>
          <p class="text-body-1">Ваша сессия истекла. Для продолжения работы необходимо войти в систему.</p>
          <p class="text-body-2 mt-3">Вы будете перенаправлены на страницу входа через {{ countdown }} секунд...</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="goToLoginNow">
            Войти сейчас
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import api from '@/services/api';

export default {
  data() {
    return {
      dialog: false,
      loading: false,
      activeTariff: null,
      selectedAccess: {
        candidates: false,
        analytics: false
      },
      selectedTariff: {
        candidates: null,
        analytics: null
      },
      candidateTariffs: [],
      analyticsTariffs: [],
      authDialog: false,
      countdown: 5,
      countdownInterval: null
    }
  },
  computed: {
    hasActiveTariff() {
      return this.activeTariff && new Date(this.activeTariff.expiry_date) > new Date();
    },
    selectedCount() {
      return Object.values(this.selectedAccess).filter(v => v).length;
    },
    totalPrice() {
      let total = 0;
      if (this.selectedAccess.candidates && this.selectedTariff.candidates) {
        total += +this.selectedTariff.candidates.price;
      }
      if (this.selectedAccess.analytics && this.selectedTariff.analytics) {
        total += +this.selectedTariff.analytics.price;
      }
      return total;
    },
    tariffWordForm() {
      const count = this.selectedCount;
      if (count % 10 === 1 && count % 100 !== 11) return 'тариф';
      if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return 'тарифа';
      return 'тарифов';
    },
    // Проверка готовности к оплате
    isPaymentReady() {
      // Проверяем что:
      // 1. Выбрана хотя бы одна опция
      // 2. Для каждой выбранной опции выбран тариф
      return this.selectedCount > 0 && 
             (!this.selectedAccess.candidates || this.selectedTariff.candidates) &&
             (!this.selectedAccess.analytics || this.selectedTariff.analytics);
    }
  },
  async mounted() {
    await Promise.all([
      this.loadActiveTariff(),
      this.loadTariffs()
    ]);
  },
  methods: {
    async loadActiveTariff() {
      try {
        const response = await api.get('/client/tariffs');
        
        // Проверяем наличие данных
        if (response.data && Array.isArray(response.data)) {
          this.activeTariff = response.data.length > 0 ? response.data[0] : null;
        } else {
          this.activeTariff = null;
        }
      } catch (error) {
        this.handleApiError(error, 'Ошибка загрузки активного тарифа');
      }
    },
    
    async loadTariffs() {
  try {
    const response = await api.get('/tariffs');
    
    // Проверяем наличие данных
    if (response.data && Array.isArray(response.data)) {
      // Загружаем активные тарифы пользователя
      const activeTariffsResponse = await api.get('/client/tariffs');
      const activeTariffIds = activeTariffsResponse.data?.map(t => t.tariff_id) || [];
      
      // Помечаем уже приобретенные тарифы
      this.candidateTariffs = response.data
        .filter(t => t.access_type === 'candidates')
        .map(tariff => ({
          ...tariff,
          isPurchased: activeTariffIds.includes(tariff.id)
        }));
        
      this.analyticsTariffs = response.data
        .filter(t => t.access_type === 'analytics')
        .map(tariff => ({
          ...tariff,
          isPurchased: activeTariffIds.includes(tariff.id)
        }));
    } else {
      this.candidateTariffs = [];
      this.analyticsTariffs = [];
    }
  } catch (error) {
    this.handleApiError(error, 'Ошибка загрузки тарифов');
  }
},
    
    handleApiError(error, defaultMessage) {
      console.error(defaultMessage, error);
      
      // Обработка ошибки аутентификации
      if (error.isAuthError) {
        this.showAuthError();
      } else {
        const errorMessage = error.response?.data?.error || 
                            error.message || 
                            defaultMessage;
        
        this.showToast(errorMessage, 'error');
      }
    },
    
    showAuthError() {
      this.authDialog = true;
      this.countdown = 5;
      
      // Запускаем обратный отсчет
      this.countdownInterval = setInterval(() => {
        this.countdown--;
        
        if (this.countdown <= 0) {
          this.goToLogin();
        }
      }, 1000);
    },
    
    goToLogin() {
      clearInterval(this.countdownInterval);
      this.authDialog = false;
      this.$router.push('/login');
    },
    
    goToLoginNow() {
      clearInterval(this.countdownInterval);
      this.authDialog = false;
      this.$router.push('/login');
    },
    
    scrollTo(elementId) {
      this.dialog = true;
      this.$nextTick(() => {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    },
    
    async processPayment() {
      this.loading = true;
      
      try {
        const selected = [];
        
        if (this.selectedAccess.candidates && this.selectedTariff.candidates) {
          selected.push({
            type: 'candidates',
            tariff_id: this.selectedTariff.candidates.id
          });
        }
        
        if (this.selectedAccess.analytics && this.selectedTariff.analytics) {
          selected.push({
            type: 'analytics',
            tariff_id: this.selectedTariff.analytics.id
          });
        }
        
        if (selected.length === 0) {
          this.showToast('Выберите хотя бы один тариф', 'error');
          return;
        }
        
        const payload = {
          tariffs: selected,
          total: this.totalPrice
        };
        
        await api.post('/purchase/tariffs', payload);
        
        this.showToast('Тарифы успешно приобретены!', 'success');
        this.dialog = false;
        await this.loadActiveTariff();
      } catch (error) {
        this.handlePaymentError(error);
      } finally {
        this.loading = false;
      }
    },
    
    handlePaymentError(error) {
      let errorMessage = 'Неизвестная ошибка при оплате';
        
      if (error.isAuthError) {
        this.showAuthError();
        return;
      } else if (error.response) {
        errorMessage = error.response.data?.error || 
                      `HTTP ошибка ${error.response.status}`;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      this.showToast(errorMessage, 'error');
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
  },
  beforeUnmount() {
    clearInterval(this.countdownInterval);
  }
}
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

#candidates {
  border-left-color: #5c6bc0;
}

#analytics {
  border-left-color: #26a69a;
}

.v-card-title {
  cursor: pointer;
}

.v-chip {
  cursor: pointer;
  transition: transform 0.2s;
}

.v-chip:hover {
  transform: translateY(-2px);
}

.v-radio-group {
  width: 100%;
}

.payment-button {
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  min-width: 220px;
  background: linear-gradient(45deg, #43a047, #2e7d32);
}

.payment-button:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.25);
}

.payment-button:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
  background: #9e9e9e;
}

.payment-button:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}
</style>