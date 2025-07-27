<template>
  <v-container class="d-flex justify-center">
    <v-card width="600" class="pa-6" elevation="8" rounded="lg">
      <v-card-title class="text-center mb-6">
        <h2 class="text-h4">{{ isLoginMode ? 'Вход' : 'Регистрация' }}</h2>
      </v-card-title>

      <v-form @submit.prevent="submitForm" v-model="formValid">
        <!-- Режим регистрации - дополнительные поля -->
        <template v-if="!isLoginMode">
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.lastName"
                label="Фамилия"
                :rules="nameRules"
                variant="outlined"
                prepend-inner-icon="mdi-account"
                required
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.firstName"
                label="Имя"
                :rules="nameRules"
                variant="outlined"
                required
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="4">
              <v-text-field
                v-model="form.middleName"
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
        </template>

        <!-- Общие поля (email + пароль) -->
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

        <!-- Подтверждение пароля (только для регистрации) -->
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

        <!-- Кнопка отправки -->
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

        <!-- Переключение между режимами -->
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

<script setup>
import { ref } from 'vue';
const formValid = ref(false);
// Состояние формы
const form = ref({
  firstName: '',
  lastName: '',
  middleName: '',
  company: '',
  email: '',
  password: '',
  confirmPassword: ''
});

// Правила валидации
const nameRules = [
  v => !!v || 'Обязательное поле',
  v => (v && v.length >= 2) || 'Минимум 2 символа',
  v => /^[а-яА-ЯёЁa-zA-Z-]+$/.test(v) || 'Только буквы и дефисы'
];

const companyRules = [
  v => !!v || 'Введите название компании',
  v => (v && v.length >= 3) || 'Минимум 3 символа'
];

const emailRules = [
  v => !!v || 'Email обязателен',
  v => /.+@.+\..+/.test(v) || 'Некорректный email'
];

const passwordRules = [
  v => !!v || 'Пароль обязателен',
  v => (v && v.length >= 8) || 'Минимум 8 символов',
  v => /[A-Z]/.test(v) || 'Должна быть хотя бы 1 заглавная буква',
  v => /\d/.test(v) || 'Должна быть хотя бы 1 цифра'
];

const confirmPasswordRules = [
  v => !!v || 'Подтвердите пароль',
  v => v === form.value.password || 'Пароли не совпадают'
];

// UI состояния
const isLoginMode = ref(false); // По умолчанию показываем регистрацию
const showPassword = ref(false);
const loading = ref(false);

const toggleMode = () => {
  isLoginMode.value = !isLoginMode.value;
  form.value = { 
    firstName: '',
    lastName: '',
    middleName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '' 
  };
};

const submitForm = async () => {
  loading.value = true;
  try {
    if (isLoginMode.value) {
      console.log('Вход:', { email: form.value.email, password: form.value.password });
      alert('Вход выполнен!');
    } else {
      const userData = { ...form.value };
      delete userData.confirmPassword; // Удаляем подтверждение пароля перед отправкой
      console.log('Регистрация:', userData);
      alert('Регистрация успешна!');
    }
  } finally {
    loading.value = false;
  }
};
</script>