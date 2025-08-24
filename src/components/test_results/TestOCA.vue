<template>
  <v-container>
    <v-dialog v-model="deleteDialog" persistent max-width="500">
      <v-card>
        <v-card-title class="headline">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить результаты пользователя 
          <strong>{{ userToDelete ? userToDelete.fullname : '' }}</strong>?
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
    <v-card>
      <v-card-title>Анализ характеристик личности</v-card-title>
      <v-spacer></v-spacer>
      <v-btn class="ml-5" color="primary" @click="exportAllToPDF" :loading="exportLoading">
        <v-icon left>mdi-download</v-icon>
        Экспорт в PDF
      </v-btn>
      <v-card-text>
        <div v-for="(user, index) in users" :key="user.user_id" class="mb-8 chart-container user-result-block" :id="'chartContainer' + index">
          <div class="d-flex justify-space-between align-center mb-2">
            <h3>{{ user.fullname }} ({{ user.gender ? 'Мужчина' : 'Женщина' }})</h3>
            <div>
              <v-btn small @click="exportSingleToPDF(index)" color="primary" :loading="singleExportLoading === index" class="mr-2">
                <v-icon small left>mdi-download</v-icon>
                Экспорт
              </v-btn>
              <v-btn small @click="openDeleteDialog(user)" color="error">
                <v-icon small left>mdi-delete</v-icon>
                Удалить
              </v-btn>
            </div>
          </div>
          


          <v-chart
            class="chart"
            :option="getUserChartOptions(user)"
            autoresize
            :ref="'chart' + index"
          />
          <!-- Альтернативный вариант с лучшей адаптивностью -->
<div class="legend-container responsive">
  <!-- Отображение значений точек -->
  <div class="points-legend">
    <div class="legend-title">Значения точек на графике:</div>
    <div class="points-grid compact">
      <div v-for="(point, pointIndex) in getUserPoints(user)" :key="pointIndex" class="point-item">
        <span class="point-value">{{ point.name }}</span>
      </div>
    </div>
  </div>  
  <!-- Легенда зон -->
  <div class="zones-legend">
    <div class="legend-title">Обозначение зон:</div>
    <div class="legend-items">
      <div class="legend-item">
        <div class="color-box" style="background-color: rgba(242, 255, 243, 0.67)"></div>
        <span class="legend-text">Приемлемый уровень</span>
      </div>
      <div class="legend-item">
        <div class="color-box" style="background-color: rgba(224, 255, 225, 0.67)"></div>
        <span class="legend-text">Приемлемый уровень при идеальных условиях</span>
      </div>
      <div class="legend-item">
        <div class="color-box" style="background-color: rgba(255, 228, 228, 0.67)"></div>
        <span class="legend-text">Желательно обратить внимание</span>
      </div>
      <div class="legend-item">
        <div class="color-box" style="background-color: rgba(255, 241, 241, 0.67)"></div>
        <span class="legend-text">Срочно обратить внимание!!!</span>
      </div>
    </div>
  </div>

  
</div>
        </div>
      </v-card-text>
    </v-card>

    <v-snackbar v-model="exportSnackbar" :timeout="3000">
      {{ exportMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn color="blue" text v-bind="attrs" @click="exportSnackbar = false">
          Закрыть
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkAreaComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import api from '@/services/api'
import result_value from '../data/percents.json'
import html2pdf from 'html2pdf.js'

use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkAreaComponent
])

export default {
  components: { VChart },
  data() {
    return {
      deleteDialog: false,
      deleteLoading: false,
      userToDelete: null,
      users: [],
      params: [],
      scores: {},
      exportLoading: false,
      singleExportLoading: null,
      exportSnackbar: false,
      exportMessage: '',
      baseChartOptions: {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const point = params[0];
            const paramName = this.getParameterByLetter(point.name);
            return `
              ${point.name} <br/>
              Значение: <b>${point.data.percentile}</b><br/>
            `;
          }
        },
        legend: {
          data: ['Результаты теста'],
          textStyle: {
            fontSize: 12
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%', // Увеличиваем отступ снизу для подписей
          containLabel: true
        },
        xAxis: {
          type: 'category',
          axisLabel: {
            rotate: 30,
            interval: 0,
            fontSize: 10,
            margin: 15,
            textStyle: {
              fontSize: 10,
              color: '#333',
              fontWeight: 'bold'
            },
            formatter: (value) => {
              const paramName = this.getParameterByLetter(value);
              return `${value}\n${paramName.length > 15 ? paramName.substring(0, 12) + '...' : paramName}`;
            }
          }
        },
        yAxis: {
          type: 'value',
          min: -100,
          max: 100,
          axisLine: {
            lineStyle: {
              color: '#999'
            }
          },
          splitLine: {
            lineStyle: {
              type: 'dashed'
            }
          },
          axisLabel: {
            fontSize: 12
          }
        }
      }
    }
  },
  mounted() {
    this.fetchResults()
  },
  methods: {
    getParameterMappings() {
      const mappings = {};
      this.params.forEach(param => {
        const letter = param.name.charAt(0).toUpperCase();
        mappings[letter] = param.name;
      });
      return mappings;
    },
    
    getParameterByLetter(letter) {
      return this.params.find(param => 
        param.name.charAt(0).toUpperCase() === letter
      )?.name || letter;
    },
    
    getLevelByPercentile(percentile) {
      if (percentile >= 32) return 'Высокий';
      if (percentile >= 5) return 'Средний';
      if (percentile >= -19) return 'Низкий';
      return 'Критический';
    },
    
    getScoreClass(percentile) {
      if (percentile >= 32) return 'high-score';
      if (percentile >= 5) return 'medium-score';
      if (percentile >= -19) return 'low-score';
      return 'critical-score';
    },
    
    calculateAveragePercentile(chartData) {
      if (!chartData.length) return 0;
      const sum = chartData.reduce((total, data) => total + data.percentile, 0);
      return Math.round(sum / chartData.length);
    },

    getUserPoints(user) {
      return this.params.map(param => {
        const rawScore = this.scores[param.id]?.[user.user_id] || 0;
        const percentile = this.getPercentile(user.gender, param.name, rawScore);
        return {
          letter: param.name.charAt(0).toUpperCase(),
          name: param.name,
          rawScore: rawScore,
          percentile: percentile
        };
      });
    },

    async exportAllToPDF() {
      this.exportLoading = true;
      this.exportMessage = 'Подготовка PDF документа...';
      this.exportSnackbar = true;
      
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const element = document.createElement('div');
        const title = document.createElement('h2');
        title.textContent = 'Результаты анализа характеристик личности - Все пользователи';
        title.style.textAlign = 'center';
        title.style.marginBottom = '30px';
        title.style.fontFamily = 'Arial, sans-serif';
        element.appendChild(title);

        // Добавляем легенду зон
    const legendDiv = document.createElement('div');
    legendDiv.innerHTML = `
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <div style="font-weight: bold; margin-bottom: 12px; color: #333; font-size: 16px; font-family: Arial, sans-serif;">
          Обозначение зон на графике:
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(242, 255, 243, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Приемлемый уровень</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(224, 255, 225, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Приемлемый уровень при идеальных условиях</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(255, 228, 228, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Желательно обратить внимание</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(255, 241, 241, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Срочно обратить внимание!!!</span>
          </div>
        </div>
      </div>
    `;
    element.appendChild(legendDiv);

        // Получаем все изображения диаграмм
        const charts = [];
        for (let i = 0; i < this.users.length; i++) {
          const chartInstance = this.$refs[`chart${i}`][0].chart;
          const imgData = await this.getChartImage(chartInstance);
          charts.push(imgData);
        }
        
        // Создаем HTML с изображениями
        for (let i = 0; i < this.users.length; i++) {
          const user = this.users[i];
          const userDiv = document.createElement('div');
          userDiv.style.marginBottom = '40px';
          userDiv.style.padding = '25px';
          userDiv.style.border = '2px solid #e0e0e0';
          userDiv.style.borderRadius = '12px';
          userDiv.style.backgroundColor = '#fafafa';
          
          const nameHeader = document.createElement('h3');
          nameHeader.textContent = `${user.fullname} (${user.gender ? 'Мужчина' : 'Женщина'})`;
          nameHeader.style.marginBottom = '20px';
          nameHeader.style.fontFamily = 'Arial, sans-serif';
          nameHeader.style.color = user.gender ? '#1976D2' : '#E91E63';
          nameHeader.style.paddingBottom = '10px';
          nameHeader.style.borderBottom = '2px solid #eee';
          userDiv.appendChild(nameHeader);
          
          const chartImg = document.createElement('img');
          chartImg.src = charts[i];
          chartImg.style.width = '100%';
          chartImg.style.marginBottom = '25px';
          chartImg.style.border = '1px solid #ddd';
          chartImg.style.borderRadius = '8px';
          userDiv.appendChild(chartImg);

          // Добавляем значения точек для каждого пользователя
          const pointsDiv = document.createElement('div');
          pointsDiv.style.marginBottom = '20px';
          
          const pointsTitle = document.createElement('h4');
          pointsTitle.textContent = 'Значения точек на графике:';
          pointsTitle.style.marginBottom = '15px';
          pointsTitle.style.fontFamily = 'Arial, sans-serif';
          pointsTitle.style.color = '#333';
          pointsDiv.appendChild(pointsTitle);

          const pointsGrid = document.createElement('div');
          pointsGrid.style.display = 'grid';
          pointsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(300px, 1fr))';
          pointsGrid.style.gap = '10px';
          pointsGrid.style.fontFamily = 'Arial, sans-serif';
          pointsGrid.style.fontSize = '12px';

          const userPoints = this.getUserPoints(user);
          userPoints.forEach(point => {
            const pointDiv = document.createElement('div');
            pointDiv.style.padding = '8px';
            pointDiv.style.border = '1px solid #e0e0e0';
            pointDiv.style.borderRadius = '6px';
            pointDiv.style.backgroundColor = '#f8f9fa';
            
            pointDiv.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">${point.name}:</span>
                <span font-weight: bold;">
                  ${point.percentile}
                </span>
              </div>
            `;
            pointsGrid.appendChild(pointDiv);
          });

          pointsDiv.appendChild(pointsGrid);
          userDiv.appendChild(pointsDiv);
          
          // Добавляем таблицу результатов для каждого пользователя
          const resultsDiv = document.createElement('div');
          resultsDiv.style.marginBottom = '20px';
          
          
          userDiv.appendChild(resultsDiv);

          element.appendChild(userDiv);

          
          
          if (i < this.users.length - 1) {
            const pageBreak = document.createElement('div');
            pageBreak.style.pageBreakAfter = 'always';
            pageBreak.style.margin = '30px 0';
            element.appendChild(pageBreak);
          }
        }
        
        const opt = {
          margin: 15,
          filename: 'Анализ характеристи личности.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(element).save();
        this.exportMessage = 'PDF успешно сгенерирован!';
      } catch (error) {
        console.error('Ошибка при экспорте PDF:', error);
        this.exportMessage = 'Ошибка при создании PDF';
      } finally {
        this.exportLoading = false;
      }
    },
    
    async exportSingleToPDF(index) {
  this.singleExportLoading = index;
  this.exportMessage = 'Подготовка PDF документа...';
  this.exportSnackbar = true;

  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const chartInstance = this.$refs[`chart${index}`][0].chart;
    const imgData = await this.getChartImage(chartInstance);

    const element = document.createElement('div');
    const title = document.createElement('h2');
    title.textContent = 'Результаты анализа характеристик личности';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.fontFamily = 'Arial, sans-serif';
    element.appendChild(title);

    const user = this.users[index];
    const nameHeader = document.createElement('h3');
    nameHeader.textContent = `${user.fullname} (${user.gender ? 'Мужчина' : 'Женщина'})`;
    nameHeader.style.marginBottom = '20px';
    nameHeader.style.fontFamily = 'Arial, sans-serif';
    nameHeader.style.color = '#1976D2';
    element.appendChild(nameHeader);


    // Добавляем легенду зон
    const legendDiv = document.createElement('div');
    legendDiv.innerHTML = `
      <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1976d2;">
        <div style="font-weight: bold; margin-bottom: 12px; color: #333; font-size: 16px; font-family: Arial, sans-serif;">
          Обозначение зон на графике:
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(242, 255, 243, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Приемлемый уровень</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(224, 255, 225, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Приемлемый уровень при идеальных условиях</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(255, 228, 228, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Желательно обратить внимание</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 20px; height: 20px; background-color: rgba(255, 241, 241, 0.67); border-radius: 3px; border: 1px solid #ddd;"></div>
            <span style="font-size: 14px; color: #555; font-family: Arial, sans-serif;">Срочно обратить внимание!!!</span>
          </div>
        </div>
      </div>
    `;
    element.appendChild(legendDiv);

    // Добавляем график
    const chartImg = document.createElement('img');
    chartImg.src = imgData;
    chartImg.style.width = '100%';
    chartImg.style.marginBottom = '25px';
    chartImg.style.border = '2px solid #ddd';
    chartImg.style.borderRadius = '8px';
    chartImg.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    element.appendChild(chartImg);

    // Добавляем таблицу с результатами
    const resultsDiv = document.createElement('div');
    resultsDiv.style.marginBottom = '25px';
    
    const resultsTitle = document.createElement('h4');
    resultsTitle.textContent = 'Детальные результаты по параметрам:';
    resultsTitle.style.marginBottom = '15px';
    resultsTitle.style.fontFamily = 'Arial, sans-serif';
    resultsTitle.style.color = '#333';
    resultsTitle.style.paddingBottom = '10px';
    resultsTitle.style.borderBottom = '2px solid #4caf50';
    resultsDiv.appendChild(resultsTitle);

    const resultsTable = document.createElement('table');
    resultsTable.style.width = '100%';
    resultsTable.style.borderCollapse = 'collapse';
    resultsTable.style.fontFamily = 'Arial, sans-serif';
    resultsTable.style.fontSize = '12px';
    resultsTable.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    
    const resultsThead = document.createElement('thead');
    resultsThead.innerHTML = `
      <tr style="background-color: #4caf50; color: white;">
        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Параметр</th>
        <th style="padding: 12px; border: 1px solid #ddd; text-align: center; width: 100px;">Значение</th>
      </tr>
    `;
    resultsTable.appendChild(resultsThead);

    const resultsTbody = document.createElement('tbody');
    
    const chartData = this.params.map(param => {
      const rawScore = this.scores[param.id]?.[user.user_id] || 0;
      const percentile = this.getPercentile(user.gender, param.name, rawScore);
      return { 
        param, 
        rawScore, 
        percentile, 
        letter: param.name.charAt(0).toUpperCase() 
      };
    });

    chartData.forEach((data, index) => {
      const row = document.createElement('tr');
      row.style.backgroundColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
      
      const level = this.getLevelByPercentile(data.percentile);
      
      row.innerHTML = `
        <td style="padding: 10px; border: 1px solid #ddd; font-weight: 500;">${data.param.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${data.percentile}</td>
      `;
      resultsTbody.appendChild(row);
    });

    resultsTable.appendChild(resultsTbody);
    resultsDiv.appendChild(resultsTable);
    element.appendChild(resultsDiv);

    const opt = {
      margin: 15,
      filename: `Анализ характеристик личности_${user.fullname}.pdf`.replace(/\s+/g, '_'),
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait' 
      }
    };

    await html2pdf().set(opt).from(element).save();
    this.exportMessage = 'PDF успешно сгенерирован!';
  } catch (error) {
    console.error('Ошибка при экспорте PDF:', error);
    this.exportMessage = 'Ошибка при создании PDF';
  } finally {
    this.singleExportLoading = null;
  }
},
    
    getChartImage(chartInstance) {
  return new Promise((resolve) => {
    // Даем больше времени для полного рендеринга графика
    setTimeout(() => {
      resolve(chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 3, // Увеличиваем качество
        backgroundColor: '#fff',
        excludeComponents: ['toolbox'] // Исключаем лишние элементы
      }));
    }, 500);
  });
},
    
    async fetchResults() {
      try {
        const response = await api.get(`/get_OCA_results/${JSON.parse(localStorage.getItem("user_info")).company_id}`)
        this.users = response.data.users || []
        this.params = response.data.params || []
        this.scores = response.data.scores || {}
      } catch (error) {
        console.error('Ошибка загрузки результатов:', error)
      }
    },
    
    getCategoryFromName(name) {
      const firstChar = name.charAt(0).toLowerCase()
      if (result_value.man[firstChar] && result_value.woman[firstChar]) {
        return firstChar
      }
      return 'a'
    },

    openDeleteDialog(user) {
      this.userToDelete = user
      this.deleteDialog = true
    },
    
    async confirmDelete() {
      if (!this.userToDelete) return
      
      this.deleteLoading = true
      try {
        const response = await api.delete('/delete_answers', { 
          data: { user_id: this.userToDelete.user_id }
        })
        console.log(response.data)
        this.exportMessage = 'Результаты пользователя успешно удалены'
        this.exportSnackbar = true
        this.fetchResults() // Обновляем список
      } catch (error) {
        console.error('Ошибка при удалении пользователя:', error)
        this.exportMessage = 'Ошибка при удалении пользователя'
        this.exportSnackbar = true
      } finally {
        this.deleteLoading = false
        this.deleteDialog = false
        this.userToDelete = null
      }
    },
    
    getPercentile(gender, paramName, score) {
      const category = this.getCategoryFromName(paramName)
      const genderData = gender ? result_value.man : result_value.woman
      const categoryData = genderData[category]
      if (!categoryData) return 0
      
      const numericScore = Math.round(Number(score))
      
      if (categoryData[numericScore] !== undefined) {
        return categoryData[numericScore]
      }
      
      const points = Object.keys(categoryData).map(Number).sort((a, b) => a - b)
      
      if (numericScore < points[0]) return categoryData[points[0]]
      if (numericScore > points[points.length - 1]) return categoryData[points[points.length - 1]]
      
      let closestPoints = points[0]
      let minDiff = Infinity
      
      for (const point of points) {
        const diff = Math.abs(numericScore - point)
        if (diff < minDiff) {
          minDiff = diff
          closestPoints = point
        }
      }
      
      return categoryData[closestPoints]
    },

    async deleteUser(userId) {
        try {
          console.log(`Удаление пользователя с ID: ${userId}`)
          this.exportMessage = `Функция удаления пользователя ${userId} будет реализована позже`
          this.exportSnackbar = true
          const response = await api.delete('/delete_answers', { 
            data: { user_id: userId } // Правильный формат отправки данных для DELETE
          });
          console.log(response.data);
          this.fetchResults(); // Обновляем список после удаления
        } catch (error) {
          console.error('Ошибка при удалении пользователя:', error)
          this.exportMessage = 'Ошибка при удалении пользователя'
          this.exportSnackbar = true
        }
    },
    
    getUserChartOptions(user) {
      const chartData = this.params.map(param => {
        const rawScore = this.scores[param.id]?.[user.user_id] || 0
        const percentile = this.getPercentile(user.gender, param.name, rawScore)
        
        return {
          value: rawScore,
          points: rawScore,
          name: param.name,
          percentile: percentile
        }
      })

      return {
        ...this.baseChartOptions,
        xAxis: {
          ...this.baseChartOptions.xAxis,
          data: chartData.map(d => d.name.charAt(0).toUpperCase()),
          axisLabel: {
    rotate: 30,
    interval: 0,
    fontSize: 12, // Уменьшаем размер шрифта с 15 до 10
    margin: 15,   // Добавляем отступ для лучшего отображения
    textStyle: {
      fontSize: 12   // Дополнительно указываем размер в textStyle
    }
  }
        },
        series: [
          {
            type: 'line',
            smooth: false,
            data: chartData.map(d => ({
              value: d.percentile,
              points: d.value,
              name: d.name,
              percentile: d.percentile
            })),
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: user.gender ? '#1976D2' : '#E91E63'
            },
            itemStyle: {
              color: user.gender ? '#1976D2' : '#E91E63'
            },
            label: {
              show: true,
              position: 'top',
              formatter: params => params.value,
              fontSize: 10
            },
            markArea: {
              silent: true,
              itemStyle: {
                color: [
                  {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                      offset: 0,
                      color: 'rgba(0, 200, 0, 0.1)'
                    }, {
                      offset: 1,
                      color: 'rgba(0, 200, 0, 0.1)'
                    }]
                  },
                  {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                      offset: 0,
                      color: 'rgba(200, 200, 0, 0.1)'
                    }, {
                      offset: 1,
                      color: 'rgba(200, 200, 0, 0.1)'
                    }]
                  },
                  {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                      offset: 0,
                      color: 'rgba(200, 100, 0, 0.1)'
                    }, {
                      offset: 1,
                      color: 'rgba(200, 100, 0, 0.1)'
                    }]
                  },
                  {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 0,
                    y2: 1,
                    colorStops: [{
                      offset: 0,
                      color: 'rgba(200, 0, 0, 0.1)'
                    }, {
                      offset: 1,
                      color: 'rgba(200, 0, 0, 0.1)'
                    }]
                  }
                ]
              },
              data: [
                [
                  {
                    yAxis: 32,
                    itemStyle: {
                      color: 'rgba(242, 255, 243, 0.67)'
                    }
                  },
                  {
                    yAxis: 100
                  }
                ],
                [
                  {
                    yAxis: 5,
                    itemStyle: {
                      color: 'rgba(224, 255, 225, 0.67)'
                    }
                  },
                  {
                    yAxis: 32
                  }
                ],
                [
                  {
                    yAxis: -19,
                    itemStyle: {
                      color: 'rgba(255, 228, 228, 0.67)'
                    }
                  },
                  {
                    yAxis: 5
                  }
                ],
                [
                  {
                    yAxis: -19,
                    itemStyle: {
                      color: 'rgba(255, 241, 241, 0.67)'
                    }
                  },
                  {
                    yAxis: -100
                  }
                ]
              ]
            }
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.chart {
  height: 500px;
  margin-bottom: 24px;
}

.legend-container {
  display: flex;
  gap: 30px;
  margin-bottom: 24px;
  align-items: flex-start;
}

.legend-container.responsive {
  flex-wrap: wrap;
}

.zones-legend {
  flex: 1;
  min-width: 300px;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
  min-height: 275px;
}

.points-legend {
  flex: 2;
  min-width: 400px;
  background-color: #f0f8ff;
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
  min-height: 275px;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 12px;
  color: #333;
  font-size: 16px;
}

.legend-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

.legend-text {
  font-size: 14px;
  color: #555;
  line-height: 1.4;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .legend-items {
    grid-template-columns: 1fr;
  }
  
  .legend-text {
    font-size: 13px;
  }
}
</style>