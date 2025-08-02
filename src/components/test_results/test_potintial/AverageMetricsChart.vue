<template>
  <div ref="chartEl" style="width: 100%; height: 100%;"></div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  props: {
    employeeData: Array,
    directorData: Array
  },
  data() {
    return {
      chart: null
    }
  },
  computed: {
    chartData() {
      const params = {}
      
      // Собираем данные сотрудников
      this.employeeData?.forEach(user => {
        Object.entries(user.params).forEach(([paramId, param]) => {
          if (!params[paramId]) {
            params[paramId] = {
              name: param.param_name,
              employeeScores: [],
              directorScores: []
            }
          }
          params[paramId].employeeScores.push(param.score)
        })
      })

      // Собираем данные руководителей
      this.directorData?.forEach(user => {
        Object.entries(user.params).forEach(([paramId, param]) => {
          if (!params[paramId]) {
            params[paramId] = {
              name: param.param_name,
              employeeScores: [],
              directorScores: []
            }
          }
          params[paramId].directorScores.push(param.score)
        })
      })

      // Вычисляем средние значения
      return Object.values(params).map(param => {
        return {
          name: param.name,
          employeeAvg: param.employeeScores.length > 0 
            ? param.employeeScores.reduce((a, b) => a + b, 0) / param.employeeScores.length
            : 0,
          directorAvg: param.directorScores.length > 0
            ? param.directorScores.reduce((a, b) => a + b, 0) / param.directorScores.length
            : 0
        }
      })
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initChart() {
      if (!this.$refs.chartEl) return

      this.chart = echarts.init(this.$refs.chartEl)
      this.updateChart()
    },
    updateChart() {
      if (!this.chart || !this.chartData?.length) return

      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Сотрудники', 'Руководители']
        },
        xAxis: {
          type: 'category',
          data: this.chartData.map(item => item.name),
          axisLabel: {
            rotate: 30,
            interval: 0
          }
        },
        yAxis: {
          type: 'value',
          name: 'Средний балл'
        },
        series: [
          {
            name: 'Сотрудники',
            type: 'bar',
            data: this.chartData.map(item => item.employeeAvg),
            itemStyle: {
              color: '#5470C6'
            }
          },
          {
            name: 'Руководители',
            type: 'bar',
            data: this.chartData.map(item => item.directorAvg),
            itemStyle: {
              color: '#91CC75'
            }
          }
        ]
      }

      this.chart.setOption(option)
    },
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    }
  },
  watch: {
    chartData: {
      deep: true,
      handler() {
        this.updateChart()
      }
    }
  }
}
</script>