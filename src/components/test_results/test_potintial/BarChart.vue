<template>
  <div ref="chartContainer" style="width: 100%; height: 100%;">
    <v-chart
      v-if="isMounted"
      :option="chartOptions"
      autoresize
      @rendered="handleChartRendered"
    />
  </div>
</template>

<script>
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export default {
  components: { VChart },
  props: {
    user: Object,
    compareData: Object
  },
  data() {
    return {
      isMounted: false
    }
  },
  mounted() {
    this.isMounted = true
    this.$nextTick(() => {
      window.addEventListener('resize', this.handleResize)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    handleChartRendered() {
      this.$nextTick(() => {
        if (this.$el && this.$el.resize) {
          this.$el.resize()
        }
      })
    },
    handleResize() {
      if (this.$el) {
        this.$el.resize()
      }
    }
  },
  computed: {
    chartOptions() {
      const categories = Object.values(this.user.params).map(p => p.param_name)
      const userScores = Object.values(this.user.params).map(p => p.score)
      
      const series = [{
        name: this.user.fullname,
        type: 'bar',
        data: userScores,
        itemStyle: {
          color: this.user.gender === true ? '#5470C6' : '#EE6666'
        }
      }]
      
      if (this.compareData) {
        const compareScores = categories.map(cat => {
          const param = Object.values(this.compareData).find(p => p.param_name === cat)
          return param ? param.score : 0
        })
        
        series.push({
          name: 'Среднее у руководителей',
          type: 'bar',
          data: compareScores,
          itemStyle: {
            color: '#91CC75'
          }
        })
      }
      
      const baseOptions = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: series.map(s => s.name),
          textStyle: {
            fontSize: this.exportMode ? 10 : 12
          }
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            rotate: this.exportMode ? 45 : 30,
            fontSize: this.exportMode ? 10 : 12
          }
        },
        yAxis: {
          type: 'value',
          name: 'Баллы',
          nameTextStyle: {
            fontSize: this.exportMode ? 10 : 12
          },
          axisLabel: {
            fontSize: this.exportMode ? 10 : 12
          }
        },
        series,
        grid: {
          left: this.exportMode ? '12%' : '10%',
          right: '5%',
          bottom: this.exportMode ? '25%' : '15%',
          top: this.exportMode ? '15%' : '10%'
        }
      }

      return baseOptions
    }
  }
}
</script>