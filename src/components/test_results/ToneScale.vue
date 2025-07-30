<template>
  <v-card>
    <v-card-title class="headline">
      Результаты теста эмоционального состояния
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="exportToPDF" class="mr-2">
        <v-icon left>mdi-file-pdf</v-icon>
        Экспорт всех
      </v-btn>
      <v-btn color="secondary" @click="exportSelectedToPDF" :disabled="!selected.length">
        <v-icon left>mdi-file-pdf</v-icon>
        Экспорт выбранных
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="points"
        item-key="user_id"
        show-select
        class="elevation-1"
      >
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
import api from '@/services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  data() {
    return {
      points: [],
      selected: [],
      headers: [
        { text: 'Выбрать', value: 'data-table-select', width: '5%' },
        { text: 'ID пользователя', value: 'user_id' },
        { text: 'Уровень', value: 'level' },
        { text: 'Описание состояния', value: 'description', width: '60%' },
      ],
      levelDescriptions: {
        '0.1-0.5': 'Глубокое депрессивное состояние, апатия, отсутствие интереса к жизни',
        '0.6-1.0': 'Депрессия, чувство безнадежности, низкая энергия',
        '1.1-1.4': 'Страх, тревожность, беспокойство',
        '1.5-2.0': 'Гнев, раздражение, враждебность',
        '2.1-2.5': 'Консерватизм, скептицизм, осторожность',
        '2.6-3.0': 'Удовлетворенность, стабильность',
        '3.1-3.5': 'Интерес, энтузиазм, умеренная активность',
        '3.6-4.0': 'Радость, высокая энергия, творчество'
      }
    }
  },
  mounted() {
    this.fetchResults();
  },
  methods: {
    async fetchResults() {
      try {
        const response = await api.get(`/get_ToneScale/${this.companyId}`); // Используйте динамический ID
        
        if (response.data.success) {
          // Преобразуем {user_id: level} в массив объектов
          this.points = Object.entries(response.data.data).map(([user_id, level]) => ({
            user_id,
            level,
            description: this.getLevelDescription(level)
          }));
        } else {
          throw new Error(response.data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        this.$toast.error('Ошибка загрузки результатов: ' + error.message);
      }
    },
    
    getLevelColor(level) {
      const levelColors = {
        '0.1-0.5': 'red darken-3',
        '0.6-1.0': 'red',
        '1.1-1.4': 'orange',
        '1.5-2.0': 'deep-orange',
        '2.1-2.5': 'blue-grey',
        '2.6-3.0': 'light-blue',
        '3.1-3.5': 'light-green',
        '3.6-4.0': 'green'
      };
      return levelColors[level] || 'grey';
    },
    
    getLevelDescription(level) {
      return this.levelDescriptions[level] || 'Неизвестный уровень эмоционального состояния';
    },
    
    exportToPDF() {
      const doc = new jsPDF();
      doc.text('Результаты теста эмоционального состояния', 14, 16);
      
      const tableData = this.points.map(item => [
        item.user_id,
        item.level,
        this.getLevelDescription(item.level)
      ]);
      
      doc.autoTable({
        head: [['ID пользователя', 'Уровень', 'Описание состояния']],
        body: tableData,
        startY: 20,
        styles: {
          cellPadding: 3,
          fontSize: 9,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 130 }
        }
      });
      
      doc.save('Все_результаты_эмоционального_состояния.pdf');
    },
    
    exportSelectedToPDF() {
      if (this.selected.length === 0) return;
      
      const doc = new jsPDF();
      doc.text('Выбранные результаты теста эмоционального состояния', 14, 16);
      
      const tableData = this.selected.map(item => [
        item.user_id,
        item.level,
        this.getLevelDescription(item.level)
      ]);
      
      doc.autoTable({
        head: [['ID пользователя', 'Уровень', 'Описание состояния']],
        body: tableData,
        startY: 20,
        styles: {
          cellPadding: 3,
          fontSize: 9,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 130 }
        }
      });
      
      doc.save('Выбранные_результаты_эмоционального_состояния.pdf');
    }
  }
}
</script>

<style scoped>
.v-card {
  padding: 20px;
  margin: 20px;
}
</style>