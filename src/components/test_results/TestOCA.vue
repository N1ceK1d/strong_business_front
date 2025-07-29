<template>
  <v-container>
    <v-card>
      <v-card-title>Анализ характеристик личности</v-card-title>
       <v-spacer></v-spacer>
        <v-btn color="primary" @click="exportAllToPDF">
          <v-icon left>mdi-file-pdf-box</v-icon>
          Экспорт в PDF
        </v-btn>
      <v-card-text>
        <div v-for="(user, index) in users" :key="user.user_id" class="mb-8 chart-container" :ref="'chartContainer' + index">
          <div class="d-flex justify-space-between align-center mb-2">
            <h3>{{ user.fullname }} ({{ user.gender ? 'Мужчина' : 'Женщина' }})</h3>
            <v-btn small @click="exportSingleToPDF(index)" color="primary">
              <v-icon small left>mdi-file-pdf-box</v-icon>
              Экспорт
            </v-btn>
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
import result_value from '@/components/test_results/percents.json'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

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
      users: [],
      params: [],
      scores: {},
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
            fontSize: 15 // Уменьшенный размер шрифта характеристик
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
      const pdf = new jsPDF('p', 'mm', 'a4')
      let position = 20

      pdf.setFontSize(16)
      pdf.text('Результаты OCA теста', 105, position, { align: 'center' })
      position += 15

      for (let i = 0; i < this.users.length; i++) {
        const container = this.$refs['chartContainer' + i][0]
        const user = this.users[i]
        
        pdf.setFontSize(12)
        pdf.text(user.fullname + ` (${user.gender ? 'Мужчина' : 'Женщина'})`, 15, position)
        position += 10

        const canvas = await html2canvas(container.querySelector('.chart'), {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#FFFFFF'
        })

        const imgData = canvas.toDataURL('image/png')
        const imgWidth = 180
        const imgHeight = (canvas.height * imgWidth) / canvas.width

        if (position + imgHeight > 280) {
          pdf.addPage()
          position = 20
        }

        pdf.addImage(imgData, 'PNG', 15, position, imgWidth, imgHeight)
        position += imgHeight + 15

        if (i < this.users.length - 1 && position > 250) {
          pdf.addPage()
          position = 20
        }
      }

      pdf.save('OCA_Все_результаты.pdf')
    },
    async exportSingleToPDF(index) {
      const pdf = new jsPDF('p', 'mm', 'a4')
      const container = this.$refs['chartContainer' + index][0]
      const user = this.users[index]

      pdf.setFontSize(16)
      pdf.text('Результаты OCA теста', 105, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.text(user.fullname + ` (${user.gender ? 'Мужчина' : 'Женщина'})`, 15, 35)

      const canvas = await html2canvas(container.querySelector('.chart'), {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF'
      })

      const imgWidth = 180
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const imgData = canvas.toDataURL('image/png')

      // Центрируем изображение
      const yPosition = Math.max(45, (297 - imgHeight) / 2) // 297mm - высота A4

      pdf.addImage(imgData, 'PNG', 15, yPosition, imgWidth, imgHeight)
      pdf.save(`OCA_${user.fullname}.pdf`.replace(/\s+/g, '_'))
    },

    exportCurrentToPDF(user) {
      const index = this.users.findIndex(u => u.user_id === user.user_id)
      if (index >= 0) {
        this.exportSingleToPDF(index)
      }
    },
    async fetchResults() {
      try {
        const response = await api.get('/get_OCA_results/1')
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