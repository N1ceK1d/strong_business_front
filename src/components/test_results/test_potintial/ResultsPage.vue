<template>
  <v-container>
    <!-- Основной контент -->
    <v-row>
      <v-col cols="12" md="6">
        <v-select
          v-model="selectedView"
          :items="viewOptions"
          :item-title="(item) => item.text"
          label="Показать"
          outlined
          :disabled="loading"
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-checkbox
          v-model="compareWithDirectors"
          label="Сравнить с руководителями"
          :disabled="loading || !directorData.length"
          hide-details
        />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="my-4">
      {{ error }}
      <v-btn text color="white" @click="$emit('refresh')">Повторить</v-btn>
    </v-alert>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="my-4" />

    <template v-else>
      <template v-if="filteredUsers.length">
        <v-row v-for="user in filteredUsers" :key="user.user_id" class="mb-4">
            <v-col cols="12">
              <v-card>
                <v-card-title @click="toggleUserExpansion(user.user_id)" style="cursor: pointer;">
                  <v-chip small class="ml-2" :color="getGenderColor(user.gender)">
                  {{ getGenderLabel(user.gender) }}
                </v-chip>
                {{ user.fullname }} 
                
                
                <label v-if="user.fullname != 'Аноним' && user.post_position != ''">
                  ({{ user.post_position }})
                </label>
                <label v-else-if="user.fullname != 'Аноним' && user.post_position == ''">
                  (Руководитель)
                </label>
                <v-spacer />
                <v-btn icon @click="expandUser[user.user_id] = !expandUser[user.user_id]">
                  <v-icon>{{ expandUser[user.user_id] ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                </v-btn>
              </v-card-title>

                <div v-if="expandUser[user.user_id]">
                  <v-card-text>
                    <div style="height: 400px; width: 100%;">
                      <BarChart 
                        :user="user" 
                        :compare-data="compareWithDirectors ? averageDirectorsData : null"
                        :key="`chart-${user.user_id}`"
                      />
                    </div>
                  </v-card-text>
                </div>

              <v-card-actions>
                <v-btn color="error" small @click="confirmDelete(user)">
                  <v-icon left>mdi-delete</v-icon>
                  Удалить
                </v-btn>
                <v-btn color="primary" small @click="exportUserToPDF(user)">
                  <v-icon left>mdi-file-pdf</v-icon>
                  Экспорт
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>
      <v-alert v-else type="info">Нет данных для отображения</v-alert>
    </template>

    <!-- Скрытый контейнер для PDF -->
    <div style="position: fixed; top: 0; left: 0; width: 0; height: 0; overflow: hidden; visibility: hidden;">
      <div v-for="user in allUsers" :id="`user-pdf-${user.user_id}`" :key="`pdf-${user.user_id}`" class="pdf-page">
        <h2 class="pdf-title">Результаты тестирования</h2>
        <div class="pdf-user-info">
          <p><strong>ФИО:</strong> {{ user.fullname }}</p>
          <p v-if="user.post_position != '' && user.fullname != 'Аноним'"><strong>Должность:</strong> {{ user.post_position }}</p>
          <p v-if="user.gender != null"><strong>Пол:</strong> {{ user.gender === true ? 'Мужской' : 'Женский' }}</p>
          <p v-if="user.post_position == '' && user.fullname != 'Аноним'"><strong>Статус:</strong> Руководитель</p>
        </div>
        
        <div class="pdf-chart-container">
          <BarChart :user="user" export-mode />
        </div>
        
        <div class="pdf-params-table">
          <table>
            <thead>
              <tr>
                <th>Параметр</th>
                <th>Баллы</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(param, id) in user.params" :key="id">
                <td>{{ param.param_name }}</td>
                <td>{{ param.score }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы действительно хотите удалить пользователя {{ userToDelete?.fullname }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="deleteDialog = false">Отмена</v-btn>
          <v-btn 
            color="red darken-1" 
            text 
            @click="deleteUser"
            :loading="deleteLoading"
          >
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import html2canvas from 'html2canvas'
import BarChart from './BarChart.vue'
import html2pdf from 'html2pdf.js'
import api from '@/services/api'

export default {
  components: { BarChart },
  props: {
    employeeData: Array,
    directorData: Array,
    loading: Boolean,
    error: String
  },
  data() {
    return {
      selectedView: 'all',
      compareWithDirectors: false,
      expandUser: {},
      deleteDialog: false,
      deleteLoading: false,
      userToDelete: null,
      viewOptions: [
        { text: 'Все', value: 'all' },
        { text: 'Только сотрудники', value: 'employees' },
        { text: 'Только руководители', value: 'directors' }
      ]
    }
  },
  computed: {
    allUsers() {
      return [...this.employeeData, ...this.directorData]
    },
    filteredUsers() {
      switch (this.selectedView) {
        case 'employees': return this.employeeData
        case 'directors': return this.directorData
        default: return this.allUsers
      }
    },
    averageDirectorsData() {
      if (!this.directorData.length) return null
      
      const params = {}
      this.directorData.forEach(director => {
        Object.entries(director.params).forEach(([paramId, paramData]) => {
          if (!params[paramId]) {
            params[paramId] = {
              param_name: paramData.param_name,
              scores: []
            }
          }
          params[paramId].scores.push(paramData.score)
        })
      })
      
      const result = {}
      Object.entries(params).forEach(([paramId, param]) => {
        result[paramId] = {
          param_name: param.param_name,
          score: param.scores.reduce((a, b) => a + b, 0) / param.scores.length
        }
      })
      
      return result
    }
  },
  methods: {
    toggleUserExpansion(userId) {
      // Используем Vue.set для реактивности
      this.$set(this.expandUser, userId, !this.expandUser[userId])
      
      // Принудительное обновление DOM
      this.$nextTick(() => {
        if (this.$refs[`chart-${userId}`]) {
          this.$refs[`chart-${userId}`].resize()
        }
      })
    },
    getGenderColor(gender) {
      if(gender == null ) {
        return 'gray';
      }
      return gender === true ? 'blue' : 'pink'
    },
    getGenderLabel(gender) {
      if(gender == null ) {
        return '?';
      }
      return gender === true ? 'М' : 'Ж'
    },
    confirmDelete(user) {
      this.userToDelete = user
      this.deleteDialog = true
    },
    async deleteUser() {
      if (!this.userToDelete) return
      
      this.deleteLoading = true
      try {
        
        await api.delete(`/delete_answers`, {
          data: {user_id: this.userToDelete.user_id}
        })
        
        
        this.deleteDialog = false
        this.userToDelete = null
      } catch (error) {
        console.error('Ошибка удаления:', error)
      } finally {
        this.deleteLoading = false
        window.location.reload();
      }
    },
    async exportUserToPDF(user) {
      try {
        const element = document.getElementById(`user-pdf-${user.user_id}`)
        const opt = {
          margin: 10,
          filename: `Результаты_${user.fullname}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2,
            logging: true,
            scrollX: 0,
            scrollY: 0
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait' 
          }
        }

        await html2pdf().from(element).set(opt).save()
      } catch (error) {
        console.error('Export error:', error)
        this.$toast.error('Ошибка при экспорте')
      }
    },
    async exportAllToPDF() {
  try {
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    });

    for (const [index, user] of this.allUsers.entries()) {
      const element = document.getElementById(`user-pdf-${user.user_id}`);
      if (!element) continue;
      
      // Временно делаем элемент видимым
      element.style.visibility = 'visible';
      element.style.position = 'absolute';
      element.style.left = '0';
      element.style.top = '0';
      
      // Конвертируем в canvas
      const canvas = await html2canvas(element, {
        scale: 5,
        logging: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth
      });
      
      // Добавляем в PDF
      const imgData = canvas.toDataURL('image/jpeg', .98);
      const pdfWidth = pdf.internal.pageSize.getWidth() - 20;
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      if (index > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight);
      
      // Возвращаем стили
      element.style.visibility = 'hidden';
      element.style.position = 'fixed';
      element.style.left = '-9999px';
    }

    pdf.save('Все_результаты.pdf');
  } catch (error) {
    console.error('Export error:', error);
    this.$toast.error('Ошибка при экспорте: ' + error.message);
  }
}
  }
}
</script>

<style scoped>
.pdf-page {
  padding: 20mm;
  font-family: Arial, sans-serif;
  width: 210mm;
  min-height: 297mm;
  box-sizing: border-box;
}

.pdf-title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 18pt;
}

.pdf-user-info {
  margin-bottom: 15mm;
  border-bottom: 1px solid #eee;
  padding-bottom: 5mm;
}

.pdf-user-info p {
  margin: 3mm 0;
  font-size: 12pt;
}

.pdf-chart-container {
  height: 120mm;
  margin: 10mm 0;
}

.pdf-params-table {
  margin-top: 5mm; /* Уменьшаем отступ */
  transform: scale(0.9); /* Масштабируем всю таблицу */
  transform-origin: top left;
  width: 90%; /* Уменьшаем ширину */
}

.pdf-params-table table {
  font-size: 12pt; /* Уменьшаем размер шрифта */
  width: 100%;
  border-collapse: collapse;
}

.pdf-params-table th, 
.pdf-params-table td {
  padding: 1mm 2mm; /* Уменьшаем padding */
  line-height: 1.2;
}

.pdf-params-table th {
  background-color: #f2f2f2;
}
</style>