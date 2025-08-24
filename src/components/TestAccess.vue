<template>
  <v-container>
    <v-card v-if="testData" class="my-4 py-1 px-1">
      <div v-html="testDescription"></div>
    </v-card>
    <v-card v-if="testData">
      <v-card-title>Информация о тесте</v-card-title>
      <v-card-text>
        <p>{{ testData.isAnonymous ? 'Тест анонимный' : '' }}</p>

        <template v-if="!testData.isAnonymous">
          <v-form v-model="formValid" class="mt-4">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="userForm.lastName"
                  label="Фамилия"
                  :rules="requiredRules"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="userForm.firstName"
                  label="Имя"
                  :rules="requiredRules"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="userForm.middleName"
                  label="Отчество"
                ></v-text-field>
              </v-col>
            </v-row>

            <v-radio-group
              v-model="userForm.gender"
              label="Пол"
              :rules="requiredRules"
              required
            >
              <v-radio
                label="Мужской"
                value="1"
              ></v-radio>
              <v-radio
                label="Женский"
                value="0"
              ></v-radio>
            </v-radio-group>

            <!-- Поле "Я руководитель" только для test_id = 1 -->
            <v-checkbox
              v-if="testData.testId === 1"
              v-model="userForm.isDirector"
              label="Я руководитель"
              class="mt-2"
              @change="handleDirectorChange"
            ></v-checkbox>
          </v-form>
        </template>

        <v-btn 
          color="primary"
          @click="startTest"
          :disabled="!testData.isAnonymous && !formValid"
        >
          Начать тест
        </v-btn>
      </v-card-text>
    </v-card>
    
    <v-alert v-else type="error">
      Неверная или поврежденная ссылка
    </v-alert>
  </v-container>
</template>

<script>
import CryptoJS from 'crypto-js';
import test_descriptions from './data/test_descriptions';

export default {
  data() {
    return {
      testData: null,
      secretKey: 't1xvuNj9aGC5TJ19P4EY0uiVRlTSXK4t ',
      formValid: false,
      userForm: {
        lastName: '',
        firstName: '',
        middleName: '',
        position: '-',
        gender: null,
        isDirector: false,
        company_id: null
      },
      requiredRules: [
        v => !!v || 'Обязательное поле'
      ],
    }
  },
  computed: {
    testDescription() {
      return test_descriptions[this.testData.testId] || 'Описание теста не найдено';
    }
  },
  created() {
    this.decryptData();
  },
  methods: {
    decryptData() {
      try {
        const encryptedData = decodeURIComponent(this.$route.params.data);
        const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        
        const linkAge = Date.now() - decryptedData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000;
        
        if (linkAge > maxAge) {
          throw new Error('Ссылка устарела');
        }
        
        this.testData = decryptedData;
        this.userForm.company_id = this.testData.companyId;
        console.log(this.testData)
      } catch (error) {
        console.error('Ошибка расшифровки:', error);
        this.testData = null;
      }
    },
    
    handleDirectorChange() {
      // При включении чекбокса "Я руководитель" очищаем поле должности
      if (this.userForm.isDirector) {
        this.userForm.position = '';
      }
      // Перепроверяем валидность формы
      this.$nextTick(() => {
        this.formValid = this.validateForm();
      });
    },
    
    validateForm() {
      // Проверяем обязательные поля
      const requiredFields = [
        this.userForm.lastName,
        this.userForm.firstName,
        this.userForm.gender
      ];
      
      
      return requiredFields.every(field => !!field);
    },
    
    startTest() {
      const query = { 
        anonymous: this.testData.isAnonymous,
        companyId: this.testData.companyId
      };
      
      if (!this.testData.isAnonymous) {
        const userData = { ...this.userForm };
        if (this.testData.testId !== 1) {
          delete userData.isDirector;
        }
        query.userData = encodeURIComponent(JSON.stringify(userData));
      }

      this.$router.push({
        path: `/test/${this.testData.testId}`,
        query: query
      });
    }
  }
}
</script>

<style scoped>
.v-card {
  max-width: 800px;
  margin: 0 auto;
}
</style>