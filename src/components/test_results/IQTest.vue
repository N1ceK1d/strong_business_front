<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card>
          <v-card-title class="headline">
            Результаты тестирования (Компания #{{ companyId }})
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="exportAllToPDF">
              <v-icon left>mdi-download</v-icon>
              Экспорт всех в PDF
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-data-table
              :headers="headers"
              :items="processedResults"
              :loading="loading"
              loading-text="Загрузка данных..."
              no-data-text="Нет данных для отображения"
            >
              <template v-slot:item.fullname="{ item }">
                {{ item.originalData.user_data.fullname }}
              </template>

              <template v-slot:item.gender="{ item }">
                {{ item.originalData.user_data.gender == true ? 'Мужчина' : 'Женщина' }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      icon
                      color="primary"
                      v-on="on"
                      @click="exportToPDF(item)"
                    >
                      <v-icon>mdi-download</v-icon>
                    </v-btn>
                  </template>
                  <span>Экспорт в PDF</span>
                </v-tooltip>

                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn
                      icon
                      color="error"
                      v-on="on"
                      @click="deleteResult(item.originalData)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </template>
                  <span>Удалить результат</span>
                </v-tooltip>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-container>

      <!-- Скрытый контейнер для генерации PDF -->
      <div style="position: absolute; left: -9999px;">
        <div id="pdf-export-container"></div>
      </div>
    </v-main>
  </v-app>
</template>

<script>
import api from '@/services/api'
import html2pdf from 'html2pdf.js'

export default {
  data() {
    return {
      loading: false,
      results: [],
      headers: [
        { 
          title: 'ФИО испытуемого', 
          value: 'fullname',
          width: '5%'
        },
        { 
          title: 'Пол', 
          value: 'gender',
          class: 'header-font-weight',
          width: '10%'
        },
        { 
          title: 'КИ (баллы)', 
          value: 'points', 
          align: 'center',
          class: 'header-font-weight',
          width: '5%'
        },
        { 
          title: 'Описательная характеристика', 
          value: 'qualification',
          class: 'header-font-weight',
          width: '10%'
        },
        { 
          title: 'Процент населения', 
          value: 'populationPercent', 
          align: 'center',
          class: 'header-font-weight',
          width: '5%'
        },
        { 
          title: 'Описание и рекомендации', 
          value: 'recommendation',
          class: 'header-font-weight',
          width: '50%'
        },
        { 
          title: 'Действия', 
          value: 'actions', 
          sortable: false, 
          align: 'center',
          class: 'header-font-weight',
          width: '10%'
        }
      ]
    }
  },
  computed: {
    processedResults() {
      return this.results.map(result => {
        const evaluation = this.evaluateResult(result.user_data.points)
        return {
          points: result.user_data.points,
          ...evaluation,
          originalData: result
        }
      })
    }
  },
  methods: {
    evaluateResult(points) {
      if (points >= 135 && points <= 200) {
        return {
          qualification: 'Очень высокий',
          populationPercent: '5%',
          recommendation: 'Старший руководитель'
        }
      } else if (points >= 110 && points <= 134) {
        return {
          qualification: 'Высокий',
          populationPercent: '10%',
          recommendation: 'Старший или младший руководитель'
        }
      } else if (points >= 100 && points <= 109) {
        return {
          qualification: 'Выше среднего',
          populationPercent: '35%',
          recommendation: 'Не руководящий пост'
        }
      } else if (points >= 90 && points <= 99) {
        return {
          qualification: 'Ниже среднего',
          populationPercent: '35%',
          recommendation: 'Не руководящий пост, рекомендуется назначать в область, которая хорошо известна и в которой есть опыт работы'
        }
      } else if (points >= 80 && points <= 89) {
        return {
          qualification: 'Низкий',
          populationPercent: '10%',
          recommendation: 'Не руководящий пост, рекомендуется назначать в область, где доказано предварительное обучение или квалификация'
        }
      } else {
        return {
          qualification: 'Очень низкий',
          populationPercent: '5%',
          recommendation: 'Следует поручать только область, в которой доказаны компетентность и квалификация'
        }
      }
    },
    async fetchResults() {
      this.loading = true
      try {
        const response = await api.get(`/get_iq_results/${JSON.parse(localStorage.getItem("user_info")).company_id}`)
        console.log(response)
        this.results = response.data
      } catch (error) {
        console.error('Ошибка при загрузке результатов:', error)
        this.$toast.error('Не удалось загрузить результаты')
      } finally {
        this.loading = false
      }
    },
    exportToPDF(item) {
      const content = this.generateSinglePdfContent(item)
      this.generatePdf(content, `Результат_${item.originalData.user_data.fullname}.pdf`)
    },
    exportAllToPDF() {
      const content = this.generateAllPdfContent()
      this.generatePdf(content, `Все_результаты_компании_${this.companyId}.pdf`)
    },
    generatePdf(content, filename) {
      const container = document.getElementById('pdf-export-container')
      container.innerHTML = content
      
      const opt = {
        margin: 10,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      html2pdf()
        .set(opt)
        .from(container)
        .save()
        .then(() => {
          container.innerHTML = ''
        })
    },
    generateSinglePdfContent(item) {
      return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 30px;">Результат тестирования интеллекта</h1>
          
          <div style="margin-bottom: 20px;">
            <h2 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Основная информация</h2>
            <p><strong>ФИО испытуемого:</strong> ${item.originalData.user_data.fullname}</p>
            <p><strong>Пол:</strong> ${item.originalData.user_data.gender === 1 ? 'Мужской' : 'Женский'}</p>
            <p><strong>КИ (баллы):</strong> ${item.points}</p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h2 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Результаты</h2>
            <p><strong>Описательная характеристика:</strong> ${item.qualification}</p>
            <p><strong>Процент населения:</strong> ${item.populationPercent}</p>
          </div>
          
          <div>
            <h2 style="margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Рекомендации</h2>
            <p>${item.recommendation}</p>
          </div>
        </div>
      `
    },
    generateAllPdfContent() {
      let rows = ''
      this.processedResults.forEach(item => {
        rows += `
          <tr>
            <td>${item.originalData.user_data.fullname}</td>
            <td>${item.originalData.user_data.gender === 1 ? 'Мужской' : 'Женский'}</td>
            <td style="text-align: center;">${item.points}</td>
            <td>${item.qualification}</td>
            <td style="text-align: center;">${item.populationPercent}</td>
            <td>${item.recommendation}</td>
          </tr>
        `
      })
      
      return `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1 style="text-align: center; margin-bottom: 30px;">Результаты тестирования интеллекта (Компания #${this.companyId})</h1>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #2962ff; color: white;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">ФИО испытуемого</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Пол</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">КИ (баллы)</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Описательная характеристика</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Процент населения</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Описание и рекомендации</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      `
    },
    async deleteResult(item) {
      try {
        const confirmed = await this.$confirm(
          `Вы уверены, что хотите удалить результат пользователя ${item.user_data.fullname}?`,
          { title: 'Подтверждение удаления' }
        )
        
        if (confirmed) {
          await api.delete(`/test/results/${item.user_data.id}`)
          this.$toast.success('Результат успешно удален')
          await this.fetchResults()
        }
      } catch (error) {
        console.error('Ошибка при удалении результата:', error)
        this.$toast.error('Не удалось удалить результат')
      }
    }
  },
  mounted() {
    this.fetchResults()
  }
}
</script>

<style scoped>
.v-data-table {
  margin-top: 20px;
}
.v-btn {
  margin: 0 5px;
}
.header-font-weight {
  font-weight: bold !important;
}
</style>