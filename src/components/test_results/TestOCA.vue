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
        <div v-for="(user, index) in users" :key="user.user_id" class="mb-8 chart-container" :id="'chartContainer' + index">
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
            return `${params[0].name}<br/>
              Балл: <b>${params[0].data.points}</b><br/>
              Процентиль: <b>${params[0].data.percentile}%</b>`
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
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          axisLabel: {
            rotate: 30,
            interval: 0,
            fontSize: 15
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
            fontSize: 15
          }
        }
      }
    }
  },
  mounted() {
    this.fetchResults()
  },
  methods: {
    async exportAllToPDF() {
      this.exportLoading = true
      this.exportMessage = 'Подготовка PDF документа...'
      this.exportSnackbar = true
      
      try {
        // Даем время для отображения сообщения
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const element = document.createElement('div')
        const title = document.createElement('h2')
        title.textContent = 'Результаты OCA теста'
        title.style.textAlign = 'center'
        title.style.marginBottom = '20px'
        element.appendChild(title)
        
        // Сначала получаем все изображения диаграмм
        const charts = []
        for (let i = 0; i < this.users.length; i++) {
          const chartInstance = this.$refs[`chart${i}`][0].chart
          const imgData = await this.getChartImage(chartInstance)
          charts.push(imgData)
        }
        
        // Затем создаем HTML с изображениями
        for (let i = 0; i < this.users.length; i++) {
          const user = this.users[i]
          const userDiv = document.createElement('div')
          
          const nameHeader = document.createElement('h3')
          nameHeader.textContent = `${user.fullname} (${user.gender ? 'Мужчина' : 'Женщина'})`
          nameHeader.style.marginBottom = '10px'
          userDiv.appendChild(nameHeader)
          
          const chartImg = document.createElement('img')
          chartImg.src = charts[i]
          chartImg.style.width = '100%'
          chartImg.style.marginBottom = '20px'
          userDiv.appendChild(chartImg)
          
          element.appendChild(userDiv)
          
          if (i < this.users.length - 1) {
            const pageBreak = document.createElement('div')
            pageBreak.style.pageBreakAfter = 'always'
            element.appendChild(pageBreak)
          }
        }
        
        const opt = {
          margin: 10,
          filename: 'OCA_Все_результаты.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        
        await html2pdf().set(opt).from(element).save()
        this.exportMessage = 'PDF успешно сгенерирован!'
      } catch (error) {
        console.error('Ошибка при экспорте PDF:', error)
        this.exportMessage = 'Ошибка при создании PDF'
      } finally {
        this.exportLoading = false
      }
    },
    
    async exportSingleToPDF(index) {
      this.singleExportLoading = index
      this.exportMessage = 'Подготовка PDF документа...'
      this.exportSnackbar = true
      
      try {
        // Даем время для отображения сообщения
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const chartInstance = this.$refs[`chart${index}`][0].chart
        const imgData = await this.getChartImage(chartInstance)
        
        const element = document.createElement('div')
        const title = document.createElement('h2')
        title.textContent = 'Результаты OCA теста'
        title.style.textAlign = 'center'
        title.style.marginBottom = '20px'
        element.appendChild(title)
        
        const user = this.users[index]
        const nameHeader = document.createElement('h3')
        nameHeader.textContent = `${user.fullname} (${user.gender ? 'Мужчина' : 'Женщина'})`
        nameHeader.style.marginBottom = '10px'
        element.appendChild(nameHeader)
        
        const chartImg = document.createElement('img')
        chartImg.src = imgData
        chartImg.style.width = '100%'
        element.appendChild(chartImg)
        
        const opt = {
          margin: 10,
          filename: `OCA_${user.fullname}.pdf`.replace(/\s+/g, '_'),
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }
        
        await html2pdf().set(opt).from(element).save()
        this.exportMessage = 'PDF успешно сгенерирован!'
      } catch (error) {
        console.error('Ошибка при экспорте PDF:', error)
        this.exportMessage = 'Ошибка при создании PDF'
      } finally {
        this.singleExportLoading = null
      }
    },
    
    getChartImage(chartInstance) {
      return new Promise((resolve) => {
        // Даем время для полного рендеринга графика
        setTimeout(() => {
          resolve(chartInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#fff'
          }))
        }, 300)
      })
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
          data: chartData.map(d => d.name.charAt(0).toUpperCase())
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
                    name: 'Приемлемый уровень',
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
                    name: 'Приемлемый уровень при идеальных условиях',
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
                    name: 'Желательно обратить внимание',
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
                    name: 'Срочно обратить внимание!!!',
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
</style>