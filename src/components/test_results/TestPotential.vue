<template>
  <v-container>

        <ResultsPage
          ref="resultsPage"
          :employee-data="employeeData"
          :director-data="directorData"
          :loading="loading"
          :error="error"
          @refresh="fetchData"
        />
        <AverageMetricsPage
          ref="averagePage"
          :employee-data="employeeData"
          :director-data="directorData"
          :loading="loading"
          :error="error"
        />

    <v-btn 
      color="primary" 
      fixed 
      bottom 
      right 
      fab
      @click="exportToPDF('all')"
      :loading="exportLoading"
    >
      <v-icon>mdi-download</v-icon>
    </v-btn>
  </v-container>
</template>

<script>
import ResultsPage from './test_potintial/ResultsPage.vue'
import AverageMetricsPage from './test_potintial/AverageMetricsPage.vue'
import api from '@/services/api'

export default {
  components: {
    ResultsPage,
    AverageMetricsPage
  },
  data() {
    return {
      tab: null,
      employeeData: [],
      directorData: [],
      loading: false,
      exportLoading: false,
      error: null,
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      this.error = null
      
      try {
        console.log(this.company_id)
        const [employees, directors] = await Promise.all([
          api.get(`/get_employee/${JSON.parse(localStorage.getItem("user_info")).company_id}`),
          api.get(`/get_directors/${JSON.parse(localStorage.getItem("user_info")).company_id}`)
        ])
        this.employeeData = employees.data.data
        this.directorData = directors.data.data
        console.log(employees)
      } catch (error) {
        console.error('Error fetching data:', error)
        this.error = 'Не удалось загрузить данные'
      } finally {
        this.loading = false
      }
    },

    async exportToPDF(type, user = null) {
      try {
        this.exportLoading = true
        await this.$nextTick()
        
        if (type === 'user' && user) {
          await this.$refs.resultsPage.exportUserToPDF(user)
        } else {
          await this.$refs.resultsPage.exportAllToPDF()
        }
      } catch (error) {
        console.error('Export error:', error)
        this.$toast.error('Ошибка при экспорте')
      } finally {
        this.exportLoading = false
      }
    }
  }
}
</script>