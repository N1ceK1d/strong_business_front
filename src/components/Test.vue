<template>
  <v-container>
    <v-form @submit.prevent="submitAnswers">
      <v-btn 
        color="primary" 
        class="ml-2"
        @click="startAutoAnswer"
        :disabled="isAutoAnswering"
      >
        {{ isAutoAnswering ? 'Автоответчик работает...' : 'Автоматически ответить' }}
      </v-btn>
      
      <v-list>
        <v-card 
          v-for="question in questions" 
          :key="question.id" 
          class="mb-4"
        >
          <v-card-title class="text-wrap">{{ question.questions }}</v-card-title>
          <div v-if="question.image_path">
            <v-img
              :src="getImageUrl(question.image_path)"
              contain
              max-height="300"
              class="ma-4"
            ></v-img>
          </div>
          <div class="answers pl-4">
            <!-- Для одного вопроса используем сортируемые чекбоксы -->
            <div v-if="questions.length === 1">
              <p class="mb-4">Выберите до 3 ответов в порядке приоритетности (первый - самый важный):</p>
              
              <draggable 
                v-model="selectedAnswers[question.id].answerIds"
                group="answers"
                handle=".handle"
                item-key="id"
                @end="updatePriorities"
              >
                <template #item="{element, index}">
                  <v-card
                    class="mb-2 pa-2 d-flex align-center"
                  >
                    <v-icon class="handle mr-2">mdi-drag</v-icon>
                    <span class="mr-2">{{ index + 1 }}.</span>
                    <span>{{ getAnswerText(question, element) }}</span>
                    <v-spacer></v-spacer>
                    <v-btn
                      icon
                      @click="removeAnswer(question.id, element)"
                    >
                      <v-icon color="error">mdi-close</v-icon>
                    </v-btn>
                  </v-card>
                </template>
              </draggable>
              
              <v-select
                v-model="newAnswerId"
                :items="availableAnswers(question)"
                label="Добавить ответ"
                :item-title="(item) => item.text"
                item-value="id"
                :outlined=true
                :disabled="selectedAnswers[question.id].answerIds.length >= 3"
                @update:model-value="addAnswer(question.id)"
              >
            
            </v-select>
            </div>
            
            <!-- Для нескольких вопросов оставляем radio -->
            <v-radio-group 
              v-else
              v-model="selectedAnswers[question.id].answerId"
              @update:model-value="updatePoints(question)"
            >
              <v-radio
                v-for="answer in question.answers"
                :key="answer.id"
                :label="`${answer.id}: ${answer.answer} (${answer.points})`"
                :value="answer.id"
              ></v-radio>
            </v-radio-group>
          </div>
        </v-card>
      </v-list>

      <v-btn 
        color="success" 
        type="submit"
        :disabled="isAutoAnswering || loading"
        :loading="loading"
      >
        Отправить
      </v-btn>
    </v-form>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import draggable from 'vuedraggable'

export default {
  components: {
    draggable
  },
  setup() {
    const route = useRoute()
    const questions = ref([])
    const newAnswerId = ref(null)
    const loading = ref(false)
    const selectedAnswers = ref({})
    const isAutoAnswering = ref(false)
    const autoAnswerInterval = ref(null)
    const userData = ref(null)
    const testData = ref({
      isAnonymous: false,
      testId: null
    })
    const answerDelay = ref(100)

    const testId = computed(() => {
      return route.params.test_data || testData.value.testId
    })

    const getImageUrl = (imagePath) => {
      try {
        // Для изображений в public
        if (imagePath.startsWith('/')) {
          return imagePath
        }
        
        // Для абсолютных URL
        if (imagePath.startsWith('http')) {
          return imagePath
        }
        
        // Для изображений в assets (Vite)
        return new URL(`../assets/images/${imagePath}`, import.meta.url).href
        
        // Для Webpack:
        // return require(`@/assets/images/${imagePath}`)
      } catch (e) {
        console.error('Ошибка загрузки изображения:', e)
        return new URL('../assets/images/placeholder.png', import.meta.url).href
      }
    }

    const isSingleQuestion = computed(() => {
      return questions.value.length === 1
    })

    const parseUserData = () => {
      try {
        if (route.query.userData) {
          userData.value = JSON.parse(decodeURIComponent(route.query.userData))
        }
        
        testData.value = {
          isAnonymous: route.query.anonymous === 'true',
          testId: route.params.id || route.params.test_data,
        }
      } catch (error) {
        console.error('Ошибка декодирования данных пользователя:', error)
      }
    }

    const fetchQuestions = async () => {
      try {
        loading.value = true
        const response = await api.get(`/get_questions/${testId.value}`)
        console.log(response.data)
        questions.value = response.data || []
        
        questions.value.forEach(question => {
          selectedAnswers.value[question.id] = isSingleQuestion.value 
            ? { answerIds: [], points: null }
            : { answerId: null, points: null }
        })
        
        selectedAnswers.value = {...selectedAnswers.value}
        
      } catch (error) {
        console.error("Ошибка при загрузке вопросов:", error)
        alert('Ошибка при загрузке вопросов')
      } finally {
        loading.value = false
      }
    }

    const updatePoints = (question) => {
      if (!selectedAnswers.value[question.id]) {
        selectedAnswers.value[question.id] = isSingleQuestion.value 
          ? { answerIds: [], points: null }
          : { answerId: null, points: null }
      }
      
      if (!isSingleQuestion.value) {
        const selectedAnswerId = selectedAnswers.value[question.id].answerId
        if (selectedAnswerId) {
          const answer = question.answers.find(a => a.id === selectedAnswerId)
          if (answer) {
            selectedAnswers.value[question.id].points = answer.points
          }
        }
      }
    }

    const startAutoAnswer = () => {
      isAutoAnswering.value = true
      let currentQuestionIndex = 0
      
      autoAnswerInterval.value = setInterval(() => {
        if (currentQuestionIndex < questions.value.length) {
          const question = questions.value[currentQuestionIndex]
          
          if (question.answers?.length > 0) {
            if (isSingleQuestion.value) {
              const shuffled = [...question.answers].sort(() => 0.5 - Math.random())
              const selected = shuffled.slice(0, 3).map(a => a.id)
              selectedAnswers.value[question.id].answerIds = selected
            } else {
              const randomIndex = 0
              const selectedAnswer = question.answers[randomIndex]
              selectedAnswers.value[question.id] = {
                answerId: selectedAnswer.id,
                points: selectedAnswer.points
              }
            }
          }
          
          currentQuestionIndex++
        } else {
          stopAutoAnswer()
          submitAnswers()
        }
      }, answerDelay.value)
    }

    const stopAutoAnswer = () => {
      clearInterval(autoAnswerInterval.value)
      autoAnswerInterval.value = null
      isAutoAnswering.value = false
    }
    

    const submitAnswers = async () => {
      try {
        loading.value = true
        
        let hasErrors = false
        
        if (isSingleQuestion.value) {
          const question = questions.value[0]
          if (selectedAnswers.value[question.id]?.answerIds?.length > 3) {
            alert('Можно выбрать не более 3 ответов!')
            hasErrors = true
          }
        } else {
          const unansweredQuestions = questions.value.filter(
            q => !selectedAnswers.value[q.id]?.answerId
          )
          
          if (unansweredQuestions.length > 0) {
            alert('Пожалуйста, ответьте на все вопросы!')
            hasErrors = true
          }
        }
        
        if (hasErrors) return

        const answersData = {
          test_id: testId.value,
          answers: [],
        }

        if (isSingleQuestion.value) {
          const question = questions.value[0]
          answersData.answers = selectedAnswers.value[question.id].answerIds.map(id => {
            const answer = question.answers.find(a => a.id === id)
            return {
              question_id: question.id,
              answer_id: id,
              points: answer ? answer.points : 0
            }
          })
        } else {
          answersData.answers = questions.value.map(question => ({
            question_id: question.id,
            answer_id: selectedAnswers.value[question.id].answerId,
            points: selectedAnswers.value[question.id].points
          }))
        }

        if (!testData.value.isAnonymous && userData.value) {
          answersData.user_data = userData.value
        } else {
          answersData.user_data = route.query
        }
        await api.post('/save_answers', answersData)
        alert('Ответы успешно отправлены!')
        
      } catch (error) {
        console.error("Ошибка при отправке ответов:", error)
        alert('Произошла ошибка при отправке ответов')
      } finally {
        loading.value = false
      }
    }

    const getAnswerText = (question, answerId) => {
      const answer = question.answers.find(a => a.id === answerId)
      return answer ? answer.answer : ''
    }
    
    const availableAnswers = (question) => {
      return question.answers
        .filter(a => !selectedAnswers.value[question.id].answerIds.includes(a.id))
        .map(a => ({
          id: a.id,
          text: a.answer
        }))
    }
    
    const addAnswer = (questionId) => {
      if (newAnswerId.value && selectedAnswers.value[questionId].answerIds.length < 3) {
        selectedAnswers.value[questionId].answerIds.push(newAnswerId.value)
        newAnswerId.value = null
        updatePriorities()
      }
    }
    
    const removeAnswer = (questionId, answerId) => {
      selectedAnswers.value[questionId].answerIds = selectedAnswers.value[questionId].answerIds
        .filter(id => id !== answerId)
      updatePriorities()
    }
    
    const updatePriorities = () => {
      console.log("Current priorities:", selectedAnswers.value)
    }

    onMounted(() => {
      parseUserData()
      fetchQuestions()
    })

    onBeforeUnmount(() => {
      stopAutoAnswer()
    })

    return {
      questions,
      newAnswerId,
      loading,
      selectedAnswers,
      isAutoAnswering,
      testId,
      isSingleQuestion,
      startAutoAnswer,
      submitAnswers,
      getAnswerText,
      availableAnswers,
      addAnswer,
      removeAnswer,
      updatePoints,
      getImageUrl
    }
  },
}
</script>

<style scoped>
.answers {
  margin-left: 20px;
}
.handle {
  cursor: move;
}
</style>