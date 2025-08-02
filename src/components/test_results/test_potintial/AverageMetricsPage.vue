<template>
  <v-container>
    <v-card>
      <v-card-title>Средние показатели по категориям</v-card-title>
      <v-card-text>
        <!-- Индикатор загрузки -->
        <v-progress-linear
          v-if="loading"
          indeterminate
          color="primary"
          class="mb-4"
        />

        <!-- Сообщение об ошибке -->
        <v-alert
          v-if="error"
          type="error"
          class="mb-4"
        >
          {{ error }}
        </v-alert>

        <!-- Сообщение при отсутствии данных -->
        <v-alert
          v-if="!loading && !error && !hasData"
          type="info"
        >
          Нет данных для отображения
        </v-alert>

        <!-- Контейнер для диаграммы -->
        <div 
          v-if="hasData"
          ref="chartContainer"
          style="height: 500px; width: 100%;"
        >
          <AverageMetricsChart
            v-if="chartReady"
            :employee-data="employeeData"
            :director-data="directorData"
          />
        </div>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import AverageMetricsChart from './AverageMetricsChart.vue'

export default {
  components: {
    AverageMetricsChart
  },
  props: {
    employeeData: {
      type: Array,
      default: () => []
    },
    directorData: {
      type: Array,
      default: () => []
    },
    loading: Boolean,
    error: String
  },
  data() {
    return {
      chartReady: false
    }
  },
  computed: {
    hasData() {
      return (this.employeeData?.length > 0 || this.directorData?.length > 0) && !this.loading
    },
    computedParams() {
      if (!this.hasData) return []

      // Собираем все уникальные параметры
      const allParams = {}

      // Обрабатываем данные сотрудников
      this.employeeData.forEach(user => {
        Object.entries(user.params).forEach(([paramId, param]) => {
          if (!allParams[paramId]) {
            allParams[paramId] = {
              id: paramId,
              name: param.param_name,
              employeeScores: [],
              directorScores: []
            }
          }
          allParams[paramId].employeeScores.push(param.score)
        })
      })

      // Обрабатываем данные руководителей
      this.directorData.forEach(user => {
        Object.entries(user.params).forEach(([paramId, param]) => {
          if (!allParams[paramId]) {
            allParams[paramId] = {
              id: paramId,
              name: param.param_name,
              employeeScores: [],
              directorScores: []
            }
          }
          allParams[paramId].directorScores.push(param.score)
        })
      })

      // Вычисляем средние значения
      return Object.values(allParams).map(param => {
        const employeeAvg = param.employeeScores.length > 0 
          ? param.employeeScores.reduce((sum, score) => sum + score, 0) / param.employeeScores.length
          : 0

        const directorAvg = param.directorScores.length > 0
          ? param.directorScores.reduce((sum, score) => sum + score, 0) / param.directorScores.length
          : 0

        return {
          ...param,
          employeeAvg,
          directorAvg,
          difference: directorAvg - employeeAvg
        }
      }).sort((a, b) => b.difference - a.difference) // Сортируем по разнице
    }
  },
  methods: {
    getDifferenceColor(difference) {
      if (difference > 0) return 'green'
      if (difference < 0) return 'red'
      return 'black'
    }
  },
  watch: {
    hasData: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.$nextTick(() => {
            this.chartReady = false
            setTimeout(() => {
              this.chartReady = true
            }, 100) // Небольшая задержка для стабильности
          })
        }
      }
    }
  }
}
</script>

<style scoped>
/* Дополнительные стили при необходимости */
</style>