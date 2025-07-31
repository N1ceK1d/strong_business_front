<template>
  <v-card class="mt-4">
    <v-card-title>
      Статистика приоритетов
      <v-chip class="ml-2" color="info" small>
        Учтено: {{ usersWithMotivations.length }} пользователей
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <v-alert v-if="chartError" type="error" class="mb-4">
        Ошибка при создании диаграмм: {{ chartError }}
      </v-alert>
      
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="primary"
      ></v-progress-linear>
      
      <template v-else>
        <!-- Контейнеры для диаграмм с явными размерами -->
        <v-row class="chart-container">
          <v-col md="15">
            <div 
              ref="pieChart" 
              class="chart"
              :style="{ height: chartHeight + 'px' }"
            ></div>
            <div class="text-center mt-2">Распределение мотиваций</div>
          </v-col>
        </v-row>
      </template>
    </v-card-text>
  </v-card>
</template>

<script>
import * as echarts from 'echarts';

export default {
  props: {
    users: {
      type: Array,
      default: () => [],
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  
  data: () => ({
    pieChart: null,
    barChart: null,
    chartError: null,
    chartHeight: 400,
    resizeObserver: null
  }),
  
  computed: {
    usersWithMotivations() {
      return this.users.filter(user => user.motivations?.length > 0);
    },
    
    motivationData() {
      const stats = {};
      
      this.usersWithMotivations.forEach(user => {
        user.motivations.forEach((motivation, index) => {
          const weight = 3 - index; // Вес по приоритету
          if (!stats[motivation.text]) {
            stats[motivation.text] = 0;
          }
          stats[motivation.text] += weight;
        });
      });
      
      return Object.entries(stats)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }));
    }
  },
  
  methods: {
    initCharts() {
      try {
        if (!this.motivationData.length) {
          this.chartError = "Нет данных для построения диаграмм";
          return;
        }
        
        this.chartError = null;
        
        // Инициализация только если элементы DOM существуют
        if (this.$refs.pieChart) {
          this.initPieChart();
        }
        
        if (this.$refs.barChart) {
          this.initBarChart();
        }
        
      } catch (error) {
        this.chartError = error.message;
        console.error("Ошибка инициализации диаграмм:", error);
      }
    },
    
    initPieChart() {
      // Уничтожаем предыдущий экземпляр
      if (this.pieChart) {
        this.pieChart.dispose();
      }
      
      // Создаем новую диаграмму
      this.pieChart = echarts.init(this.$refs.pieChart);
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center'
        },
        series: [{
          name: 'Мотивации',
          type: 'pie',
          radius: ['30%', '70%'],
          center: ['40%', '50%'],
          data: this.motivationData,
          label: {
            show: true,
            formatter: '{b}: {c}'
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      
      this.pieChart.setOption(option);
    },
    
    initBarChart() {
      if (this.barChart) {
        this.barChart.dispose();
      }
      
      this.barChart = echarts.init(this.$refs.barChart);
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          name: 'Взвешенная сумма'
        },
        yAxis: {
          type: 'category',
          data: this.motivationData.map(item => item.name),
          axisLabel: {
            interval: 0,
            rotate: 30
          }
        },
        series: [{
          name: 'Мотивации',
          type: 'bar',
          data: this.motivationData.map(item => item.value),
          itemStyle: {
            color: (params) => {
              const colors = ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            position: 'right'
          }
        }]
      };
      
      this.barChart.setOption(option);
    },
    
    handleResize() {
      try {
        if (this.pieChart) {
          this.pieChart.resize();
        }
        if (this.barChart) {
          this.barChart.resize();
        }
      } catch (error) {
        console.error("Ошибка при ресайзе диаграмм:", error);
      }
    },
    
    observeResize() {
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
      }
      
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      
      if (this.$refs.pieChart) {
        this.resizeObserver.observe(this.$refs.pieChart);
      }
      if (this.$refs.barChart) {
        this.resizeObserver.observe(this.$refs.barChart);
      }
    }
  },
  
  watch: {
    users: {
      handler() {
        if (!this.loading) {
          this.$nextTick(() => {
            this.initCharts();
            this.observeResize();
          });
        }
      },
      deep: true
    },
    loading(newVal) {
      if (!newVal) {
        this.$nextTick(() => {
          this.initCharts();
          this.observeResize();
        });
      }
    }
  },
  
  mounted() {
    window.addEventListener('resize', this.handleResize);
    if (!this.loading) {
      this.$nextTick(() => {
        this.initCharts();
        this.observeResize();
      });
    }
  },
  
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.pieChart) {
      this.pieChart.dispose();
    }
    if (this.barChart) {
      this.barChart.dispose();
    }
  }
};
</script>

<style scoped>
.chart-container {
  margin-top: 20px;
}

.chart {
  width: 100%;
  min-height: 300px;
}

@media (max-width: 960px) {
  .chart {
    height: 300px !important;
  }
}
</style>