<template>
  <v-container>
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

            <v-text-field
              v-model="userForm.position"
              label="Должность"
              :rules="requiredRules"
              required
              class="mb-4"
            ></v-text-field>

            <v-radio-group
              v-model="userForm.gender"
              label="Пол"
              :rules="requiredRules"
              required
            >
              <v-radio
                label="Мужской"
                value="male"
              ></v-radio>
              <v-radio
                label="Женский"
                value="female"
              ></v-radio>
            </v-radio-group>
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
        position: '',
        gender: null
      },
      requiredRules: [
        v => !!v || 'Обязательное поле'
      ]
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
      } catch (error) {
        console.error('Ошибка расшифровки:', error);
        this.testData = null;
      }
    },
    
    startTest() {
      const query = { 
        anonymous: this.testData.isAnonymous 
      };
      
      if (!this.testData.isAnonymous) {
        query.userData = encodeURIComponent(JSON.stringify(this.userForm));
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