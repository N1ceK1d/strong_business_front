<template>
  <v-container>
    <!-- Герой-секция -->
    <v-row class="my-15" align="center">
      <v-col cols="12" md="6">
        <h1 class="text-h3 text-md-h2 font-weight-bold text-primary mb-4">
          Сильный бизнес
        </h1>
        <p class="text-h6 text-md-h5 text-medium-emphasis mb-6">
          Профессиональная платформа для анализа персонала. Раскройте потенциал вашей команды и принимайте взвешенные кадровые решения на основе данных.
        </p>
        <v-btn
          color="primary"
          size="x-large"
          @click="navigateToAuth"
          class="mr-4"
        >
          Начать работать
        </v-btn>
      </v-col>
      <v-col cols="12" md="6" class="text-center">
        <v-img
          :src="heroImage"
          contain
          max-height="400"
          class="mx-auto"
        ></v-img>
      </v-col>
    </v-row>

    <!-- Секция преимуществ -->
    <v-row class="my-15">
      <v-col cols="12">
        <h2 class="text-h4 text-center font-weight-bold mb-10">Почему выбирают нас?</h2>
      </v-col>
      <v-col
        v-for="(benefit, i) in benefits"
        :key="i"
        cols="12"
        md="4"
      >
        <v-card variant="flat" border class="h-100 pa-5 text-center">
          <v-icon size="64" color="primary" class="mb-4">{{ benefit.icon }}</v-icon>
          <v-card-title class="text-h5 justify-center">{{ benefit.title }}</v-card-title>
          <v-card-text class="text-body-1">{{ benefit.text }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Секция "Наши тесты" -->
    <v-row class="my-15">
      <v-col cols="12">
        <h2 class="text-h4 text-center font-weight-bold mb-10">Комплексная диагностика команды</h2>
        <p class="text-h6 text-center text-medium-emphasis mb-10">
          5 профессиональных тестов для построения сильной и эффективной команды
        </p>
      </v-col>
      <v-col
        v-for="test in tests"
        :key="test.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-hover v-slot:default="{ isHovering, props }">
          <v-card
            v-bind="props"
            :class="{ 'on-hover': isHovering }"
            :elevation="isHovering ? 12 : 3"
            class="mx-auto test-card h-100 d-flex flex-column"
          >
            <v-card-title class="text-h5">{{ test.title }}</v-card-title>
            <v-card-subtitle class="text-body-1">{{ test.questions }} вопросов</v-card-subtitle>
            <v-card-text class="text-body-1 flex-grow-1">
              <div class="mb-3">
                <span class="font-weight-bold">Что оценивает:</span> {{ test.assesses }}
              </div>
              <div class="mb-3">
                <span class="font-weight-bold">Результат:</span> {{ test.result }}
              </div>
              <div>
                <span class="font-weight-bold">Для кого:</span> {{ test.audience }}
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn color="primary" variant="text" @click="navigateToAuth">Пройти тест</v-btn>
            </v-card-actions>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>

    <!-- Секция CTA -->
    <v-row class="my-15 text-center bg-grey-lighten-3 py-10 rounded">
      <v-col cols="12">
        <h2 class="text-h3 font-weight-bold mb-4">Готовы раскрыть потенциал вашей команды?</h2>
        <p class="text-h6 text-medium-emphasis mb-6">
          Присоединяйтесь к тысячам руководителей, которые уже используют наши инструменты для роста бизнеса
        </p>
        <v-btn
          color="primary"
          size="x-large"
          @click="navigateToAuth"
          class="mr-4"
        >
          Зарегистрироваться
        </v-btn>
        <v-btn
          variant="outlined"
          size="x-large"
          @click="navigateToAuth"
        >
          Войти
        </v-btn>
      </v-col>
    </v-row>

    <!-- Секция статистики -->
    <v-row class="my-15 text-center">
      <v-col cols="12">
        <h2 class="text-h4 font-weight-bold mb-10">Нас выбирают</h2>
      </v-col>
      <v-col
        v-for="(stat, i) in statistics"
        :key="i"
        cols="6"
        md="3"
      >
        <div class="text-h3 font-weight-bold text-primary">{{ stat.value }}</div>
        <div class="text-body-1 text-medium-emphasis">{{ stat.label }}</div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'HomeView',
  data() {
    return {
      heroImage: 'https://cdn.vuetifyjs.com/images/parallax/material2.jpg',
      benefits: [
        {
          icon: 'mdi-chart-bar',
          title: 'Данные, а не догадки',
          text: 'Принимайте решения на основе точных данных о вашей команде, а не интуитивных предположений.'
        },
        {
          icon: 'mdi-account-group',
          title: 'Снижение текучки',
          text: 'Узнайте истинные мотивы сотрудников и создайте условия, в которых они захотят остаться.'
        },
        {
          icon: 'mdi-rocket-launch',
          title: 'Рост эффективности',
          text: 'Выявите скрытые проблемы и точки роста для увеличения продуктивности команды.'
        }
      ],
      tests: [
        {
          id: 1,
          title: 'Анализ потенциала персонала',
          questions: '140',
          assesses: '14 ключевых критериев: руководство, мотивация, ответственность, вовлеченность, карьерные возможности',
          result: 'Сравнительный анализ видения руководителя и сотрудников, выявление "слепых зон"',
          audience: 'Для руководителей и всей команды'
        },
        {
          id: 2,
          title: 'Тест на мотивацию',
          questions: '1',
          assesses: 'Ключевые мотиваторы: деньги, карьера, признание, стабильность, самореализация',
          result: 'Индивидуальные профили мотивации и общая карта мотивации коллектива',
          audience: 'Для всех сотрудников'
        },
        {
          id: 3,
          title: 'Анализ эмоционального состояния',
          questions: '105',
          assesses: 'Эмоциональную устойчивость, здоровье, честность, ответственность, лидерский потенциал',
          result: 'Уровень эмоционального состояния (высокий, средний, низкий) с рекомендациями',
          audience: 'Для HR и руководителей при найме'
        },
        {
          id: 4,
          title: 'Оценка компетенций',
          questions: '120',
          assesses: 'Профессиональные навыки, soft skills, лидерские качества, аналитические способности',
          result: 'Детальная карта компетенций с зонами развития для каждого сотрудника',
          audience: 'Для оценки профессиональных качеств'
        },
        {
          id: 5,
          title: 'Диагностика командной динамики',
          questions: '95',
          assesses: 'Взаимодействие в команде, распределение ролей, коммуникации, разрешение конфликтов',
          result: 'Анализ групповых процессов и рекомендации по улучшению командной работы',
          audience: 'Для рабочих групп и отделов'
        }
      ],
      statistics: [
        { value: '1000+', label: 'компаний' },
        { value: '95%', label: 'точность анализа' },
        { value: '30%', label: 'рост эффективности' },
        { value: '24/7', label: 'техподдержка' }
      ]
    }
  },
  methods: {
    navigateToAuth() {
      this.$router.push('/authorization');
    }
  }
})
</script>

<style scoped>
.test-card {
  transition: all 0.3s ease;
}
.v-card.on-hover {
  transform: translateY(-5px);
}
.text-primary {
  color: rgb(var(--v-theme-primary));
}
.bg-grey-lighten-3 {
  background-color: rgba(var(--v-theme-grey-lighten-3), 1);
}
</style>