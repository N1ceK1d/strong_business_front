<template>
  <v-card class="mx-auto" max-width="95%">
    <!-- Модальное окно подтверждения удаления -->
    <v-dialog v-model="deleteDialog" persistent max-width="500">
      <v-card>
        <v-card-title class="headline">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить результат теста для
          <strong>{{ userToDelete?.user_fullname || 'пользователя' }}</strong>?
          <br>Это действие нельзя будет отменить.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">
            Отмена
          </v-btn>
          <v-btn color="error" text @click="confirmDelete" :loading="deleteLoading">
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card-title class="d-flex justify-space-between align-center">
      <span class="text-h5">Результаты теста эмоционального состояния</span>
      <div>
        <v-btn 
          color="primary" 
          @click="exportPDF(false)" 
          class="mr-2"
        >
          <v-icon left>mdi-download</v-icon>
          Экспорт всех
        </v-btn>
      </div>
    </v-card-title>

    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="points"
        :items-per-page="10"
        item-key="user_id"
        class="elevation-1"
        :loading="loading"
        loading-text="Загрузка данных..."
      >
        <template v-slot:item.actions="{ item }">
          <v-btn
            color="secondary"
            small
            @click="exportSinglePDF(item)"
            class="mr-2"
          >
            <v-icon small>mdi-download</v-icon>
          </v-btn>
          <v-btn
            color="error"
            small
            @click="openDeleteDialog(item)"
          >
            <v-icon small>mdi-delete</v-icon>
          </v-btn>
        </template>

        <template v-slot:item.level="{ item }">
          <v-chip :color="getLevelColor(item.level)" dark>
            {{ item.level }}
          </v-chip>
        </template>
        
        <template v-slot:item.description="{ item }">
          {{ getLevelDescription(item.level) }}
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script>
import html2pdf from 'html2pdf.js';
import api from '@/services/api';
import tone_scale_levels from '../data/tones_descriptions';

export default {
  data() {
    return {
      points: [],
      loading: false,
      // Данные для модального окна удаления
      deleteDialog: false,
      deleteLoading: false,
      userToDelete: null,
      
      headers: [
        { 
          text: 'Пользователь', 
          value: 'user_fullname', 
          width: '25%' 
        },
        { 
          text: 'Уровень', 
          value: 'level', 
          width: '15%', 
          align: 'center' 
        },
        { 
          text: 'Описание состояния', 
          value: 'description', 
          width: '45%' 
        },
        { 
          text: 'Действия', 
          value: 'actions', 
          width: '15%',
          sortable: false,
          align: 'center'
        },
      ],
      levelDescriptions: {
        '0.1-0.5': tone_scale_levels[0].description,
        '0.6-1.0': tone_scale_levels[1].description,
        '1.1-1.4': tone_scale_levels[2].description,
        '1.5-2.0': tone_scale_levels[3].description,
        '2.1-2.5': tone_scale_levels[4].description,
        '2.6-3.0': tone_scale_levels[5].description,
        '3.1-3.5': tone_scale_levels[6].description,
        '3.6-4.0': tone_scale_levels[7].description
      },
      levelColors: {
        '0.1-0.5': 'red darken-3',
        '0.6-1.0': 'red',
        '1.1-1.4': 'orange',
        '1.5-2.0': 'deep-orange',
        '2.1-2.5': 'blue-grey',
        '2.6-3.0': 'light-blue',
        '3.1-3.5': 'light-green',
        '3.6-4.0': 'green'
      }
    }
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    // Методы для работы с модальным окном удаления
    openDeleteDialog(item) {
      this.userToDelete = item;
      this.deleteDialog = true;
    },
    
    async confirmDelete() {
      if (!this.userToDelete) return;
      
      this.deleteLoading = true;
      try {
        await api.delete('/delete_results', await api.delete('/delete_answers', { 
          data: { user_id: this.userToDelete.user_data.id }
        }));
        this.$toast.success('Результат удален');
        await this.fetchResults();
      } catch (error) {
        console.error('Ошибка удаления:', error);
        this.$toast.error('Ошибка при удалении результата');
      } finally {
        this.deleteLoading = false;
        this.deleteDialog = false;
        this.userToDelete = null;
      }
    },
    
    async fetchResults() {
      this.loading = true;
      try {
        const response = await api.get(`/get_ToneScale/${JSON.parse(localStorage.getItem("user_info")).company_id}`);
        if (response.data.success) {
          this.points = Object.entries(response.data.data).map(([user_id, userData]) => ({
            user_id,
            user_fullname: userData.fullname || 'Неизвестный пользователь',
            level: userData.level || 'Н/Д',
            description: this.getLevelDescription(userData.level)
          }));
        }
      } catch (error) {
        console.error('Ошибка загрузки:', error);
        this.$toast.error('Не удалось загрузить результаты');
      } finally {
        this.loading = false;
      }
    },
    
    getLevelColor(level) {
      return this.levelColors[level] || 'grey';
    },
    
    getLevelDescription(level) {
      return this.levelDescriptions[level] || 'Неизвестный уровень';
    },
    
    async exportPDF(onlySelected = false) {
      try {
        const items = onlySelected ? this.selected : this.points;
        if (items.length === 0) {
          this.$toast.warning('Нет данных для экспорта');
          return;
        }
        
        await this.generatePDF(items, `Результаты_${new Date().toLocaleDateString('ru-RU')}.pdf`);
        
      } catch (error) {
        console.error('Ошибка экспорта:', error);
        this.$toast.error('Ошибка при создании PDF');
      }
    },
    
    async exportSinglePDF(item) {
      try {
        await this.generatePDF([item], `Результат_${item.user_fullname}_${new Date().toLocaleDateString('ru-RU')}.pdf`);
      } catch (error) {
        console.error('Ошибка экспорта:', error);
        this.$toast.error('Ошибка при создании PDF');
      }
    },
    
    async generatePDF(items, filename) {
      const element = document.createElement('div');
      element.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 20px;">
          ${items.length > 1 ? 'Результаты теста' : 'Результат теста'}
        </h2>
        <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="width: 30%; text-align: left;">Пользователь</th>
              <th style="width: 15%; text-align: center;">Уровень</th>
              <th style="width: 55%; text-align: left;">Описание состояния</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr>
                <td>${item.user_fullname}</td>
                <td style="text-align: center; background-color: ${this.getHexColor(item.level)}; color: white;">
                  ${item.level}
                </td>
                <td>${item.description}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <p style="text-align: right; margin-top: 20px; font-size: 0.8em;">
          Сформировано ${new Date().toLocaleDateString('ru-RU')}
        </p>
      `;
      
      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().from(element).set(opt).save();
    },
    
    getHexColor(level) {
      const colors = {
        '0.1-0.5': '#c62828',
        '0.6-1.0': '#e53935',
        '1.1-1.4': '#fb8c00',
        '1.5-2.0': '#f4511e',
        '2.1-2.5': '#546e7a',
        '2.6-3.0': '#039be5',
        '3.1-3.5': '#7cb342',
        '3.6-4.0': '#43a047'
      };
      return colors[level] || '#9e9e9e';
    }
  }
}
</script>

<style scoped>
.v-card {
  margin: 20px auto;
  padding: 20px;
  border-radius: 8px;
}

.v-data-table {
  border-radius: 4px;
  overflow: hidden;
}

.v-card-title {
  padding: 16px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
}

.v-btn {
  min-width: 36px;
}
</style>