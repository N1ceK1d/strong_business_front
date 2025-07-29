<template>
  <v-container>
    <v-card>
      <v-card-title>Аналитика продаж</v-card-title>
      <v-card-text>
        <v-chart
          class="chart"
          :option="chartOptions"
          autoresize
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart, BarChart, LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  PieChart,
  BarChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

export default {
  components: { VChart },
  data() {
    return {
      chartOptions: {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['Продажи', 'Затраты']
        },
        xAxis: {
          type: 'category',
          data: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Продажи',
            type: 'line',
            smooth: true,
            data: [120, 132, 101, 134, 190, 230]
          },
          {
            name: 'Затраты',
            type: 'bar',
            data: [80, 95, 70, 110, 125, 140]
          }
        ]
      }
    }
  }
}
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>