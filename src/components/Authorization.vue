<template>
  <v-container class="d-flex justify-center">
    <v-card width="600" class="pa-6" elevation="8" rounded="lg">
      <v-card-title class="text-center mb-6">
        <h2 class="text-h4">{{ isLoginMode ? 'Вход' : 'Регистрация' }}</h2>
      </v-card-title>

      <v-alert
        v-if="errorMessage"
        type="error"
        class="mb-4"
      >
        {{ errorMessage }}
      </v-alert>

      <v-form @submit.prevent="submitForm" v-model="formValid" ref="form">
        <template v-if="!isLoginMode">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.last_name"
                label="Фамилия"
                :rules="nameRules"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                required
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.first_name"
                label="Имя"
                :rules="nameRules"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.middle_name"
                label="Отчество"
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-text-field
            v-model="form.company"
            label="Название компании"
            :rules="companyRules"
            variant="outlined"
            prepend-inner-icon="mdi-office-building"
            required
            class="mb-3"
          ></v-text-field>

          <v-text-field
            v-model="form.phone"
            label="Телефон"
            :rules="phoneRules"
            variant="outlined"
            prepend-inner-icon="mdi-phone"
            required
            class="mb-3"
            v-mask="'+7 (###) ###-##-##'"
            placeholder="+7 (___) ___-__-__"
          ></v-text-field>

        </template>

        <v-text-field
          v-model="form.email"
          label="Email"
          type="email"
          :rules="emailRules"
          required
          variant="outlined"
          prepend-inner-icon="mdi-email"
          class="mb-3"
        ></v-text-field>

        <v-text-field
          v-model="form.password"
          label="Пароль"
          :type="showPassword ? 'text' : 'password'"
          :rules="passwordRules"
          required
          variant="outlined"
          prepend-inner-icon="mdi-lock"
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword"
          class="mb-3"
        ></v-text-field>

        <v-text-field
          v-if="!isLoginMode"
          v-model="form.confirmPassword"
          label="Подтвердите пароль"
          :type="showPassword ? 'text' : 'password'"
          :rules="confirmPasswordRules"
          required
          variant="outlined"
          prepend-inner-icon="mdi-lock-check"
          class="mb-3"
        ></v-text-field>

        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          :loading="loading"
          class="mt-2"
          :disabled="!formValid"
        >
          {{ isLoginMode ? 'Войти' : 'Зарегистрироваться' }}
        </v-btn>

        <div class="text-center mt-4">
          <p class="text-body-2">
            {{ isLoginMode ? 'Нет аккаунта?' : 'Уже есть аккаунт?' }}
            <a href="#" @click.prevent="toggleMode" class="text-primary">
              {{ isLoginMode ? 'Создать' : 'Войти' }}
            </a>
          </p>
        </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>
import { mask } from 'vue-the-mask'
import api from '@/services/api'
import { useAuthStore } from '@/store/auth'

export default {
  directives: { mask },
  data() {
    return {
      formValid: false,
      form: {
        first_name: '',
        last_name: '',
        middle_name: '',
        company: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: ''
      },
      isLoginMode: true,
      showPassword: false,
      loading: false,
      errorMessage: ''
    }
  },
  computed: {
    nameRules() {
      return [
        v => !!v || 'Обязательное поле',
        v => (v && v.length >= 2) || 'Минимум 2 символа',
        v => /^[а-яА-ЯёЁa-zA-Z-]+$/.test(v) || 'Только буквы и дефисы'
      ]
    },
    companyRules() {
      return [
        v => !!v || 'Введите название компании',
        v => (v && v.length >= 3) || 'Минимум 3 символа'
      ]
    },
    emailRules() {
      return [
        v => !!v || 'Email обязателен',
        v => /.+@.+\..+/.test(v) || 'Некорректный email'
      ]
    },
    passwordRules() {
      return [
        v => !!v || 'Пароль обязателен',
        v => (v && v.length >= 8) || 'Минимум 8 символов',
        v => /[A-Z]/.test(v) || 'Должна быть хотя бы 1 заглавная буква',
        v => /\d/.test(v) || 'Должна быть хотя бы 1 цифра'
      ]
    },
    confirmPasswordRules() {
      return [
        v => !!v || 'Подтвердите пароль',
        v => v === this.form.password || 'Пароли не совпадают'
      ]
    },
    phoneRules() {
      return [
        v => !!v || 'Телефон обязателен',
        v => (v && v.replace(/\D/g, '').length === 11) || 'Введите полный номер телефона'
      ]
    }
  },
  methods: {
    toggleMode() {
      this.isLoginMode = !this.isLoginMode
      this.errorMessage = ''
      this.$refs.form.reset()
    },
    async submitForm() {
      if (!this.formValid) return
      
      this.loading = true
      this.errorMessage = ''

      try {
        if (this.isLoginMode) {
          await this.handleLogin()
        } else {
          await this.handleRegistration()
        }
      } catch (error) {
        this.handleError(error)
      } finally {
        this.loading = false
      }
    },
    
    async handleLogin() {
      try {
        const response = await api.post('/login', {
          email: this.form.email,
          password: this.form.password
        });

        // Проверяем структуру ответа
        if (response.data && response.data.token && response.data.user) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user_info', JSON.stringify(response.data.user));
          
          console.log('Аутентификация успешна. Токен сохранен:', response.data.token);
          
          const authStore = useAuthStore();
          authStore.setAuth(response.data.token);

          await this.$router.push('/profile');
        } else {
          throw new Error('Неверный формат ответа сервера');
        }
      } catch (error) {
        console.error('Login error:', error)
        
        // Анализируем ошибку
        if (error.response) {
          // Ошибка от сервера (4xx, 5xx)
          if (error.response.status === 401) {
            this.errorMessage = 'Неверный email или пароль'
          } else {
            this.errorMessage = error.response.data?.error || 'Ошибка авторизации'
          }
        } else if (error.request) {
          // Запрос был сделан, но ответ не получен
          this.errorMessage = 'Сервер не отвечает'
        } else {
          // Ошибка настройки запроса
          this.errorMessage = error.message || 'Ошибка при отправке запроса'
        }
      }
    },
    
    async handleRegistration() {
      try {
        // Очищаем телефон от маски
        const cleanPhone = this.form.phone.replace(/\D/g, '')
        
        // Формируем данные для регистрации
        const registrationData = {
          email: this.form.email,
          password: this.form.password,
          first_name: this.form.first_name,
          last_name: this.form.last_name,
          middle_name: this.form.middle_name,
          company: this.form.company,
          phone: cleanPhone
        }

        const response = await api.post('/register', registrationData)

        // Проверяем структуру ответа
        if (!response.data || !response.data.token || !response.data.user) {
          throw new Error('Неверный формат ответа сервера')
        }

        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user_info', JSON.stringify(response.data.user))

        const authStore = useAuthStore()
        authStore.setAuth(response.data.token)

        await this.$router.push('/profile')
      } catch (error) {
        console.error('Registration error:', error)
        
        // Анализируем ошибку
        if (error.response) {
          // Ошибка от сервера
          if (error.response.status === 409) {
            this.errorMessage = 'Пользователь с таким email уже существует'
          } else if (error.response.status === 400) {
            // Обработка ошибок валидации
            if (error.response.data?.missing) {
              this.errorMessage = `Не заполнены обязательные поля: ${error.response.data.missing.join(', ')}`
            } else {
              this.errorMessage = error.response.data?.error || 'Ошибка в данных'
            }
          } else {
            this.errorMessage = error.response.data?.error || 'Ошибка регистрации'
          }
        } else if (error.request) {
          this.errorMessage = 'Сервер не отвечает'
        } else {
          this.errorMessage = error.message || 'Ошибка при отправке запроса'
        }
      }
    },
    
    handleError(error) {
      // Автоматически очищаем ошибку через 5 секунд
      setTimeout(() => {
        this.errorMessage = ''
      }, 5000)
    }
  }
}
</script>

<style scoped>
.v-card {
  max-width: 600px;
  width: 100%;
}

@media (max-width: 600px) {
  .v-card {
    padding: 16px;
  }
}
</style>