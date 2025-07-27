<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title class="text-center">Профиль</v-card-title>
          <v-card-text>
            <v-avatar size="120" class="mx-auto d-block mb-4">
              <v-img :src="user.avatar || 'https://cdn.vuetifyjs.com/images/john.jpg'"></v-img>
            </v-avatar>
            
            <v-list lines="two">
              <v-list-item
                prepend-icon="mdi-account"
                :title="user.fullName"
                :subtitle="'Роль: ' + user.role"
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
        <!-- Вкладки -->
        <v-tabs v-model="tab" grow>
          <v-tab value="tests">Мои тесты</v-tab>
          <v-tab value="settings">Настройки</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Вкладка с тестами -->
          <v-window-item value="tests">
            <v-card class="mt-4">
              <v-card-title>История тестирований</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="test in user.tests"
                    :key="test.id"
                    :title="test.name"
                    :subtitle="`Пройден: ${test.date} | Результат: ${test.score}%`"
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
          </v-window-item>

          <!-- Вкладка с настройками -->
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
                  
                  <v-file-input
                    label="Аватар"
                    prepend-icon="mdi-camera"
                    @change="uploadAvatar"
                    accept="image/*"
                  ></v-file-input>
                  
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

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const tab = ref('tests')

// Данные пользователя
const user = reactive({
  id: 1,
  fullName: 'Иванов Иван Иванович',
  email: 'ivanov@example.com',
  phone: '+7 (987) 654-32-10',
  company: 'Strong Business',
  role: 'Пользователь',
  avatar: '',
  tests: [
    { id: 1, name: 'Тест на стрессоустойчивость', date: '12.05.2023', score: 85 },
    { id: 2, name: 'Оценка лидерских качеств', date: '28.05.2023', score: 72 },
    { id: 3, name: 'Тест на профориентацию', date: '15.06.2023', score: 91 }
  ]
})

// Редактируемая копия
const editUser = reactive({ ...user })

// Переход к результатам теста
const goToTestResults = (testId) => {
  router.push(`/test-results/${testId}`)
}

// Загрузка аватара
const uploadAvatar = (file) => {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      user.avatar = e.target.result
      editUser.avatar = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

// Сохранение профиля
const saveProfile = () => {
  Object.assign(user, editUser)
  // Здесь обычно отправка на сервер
  alert('Изменения сохранены!')
}
</script>

<style scoped>
.v-avatar {
  border: 3px solid #1976D2;
}
</style>