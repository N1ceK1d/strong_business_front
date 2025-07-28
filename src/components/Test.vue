<template>
    <v-container>
        <v-form @submit.prevent="submitAnswers">
            <v-btn 
                color="primary" 
                class="ml-2"
                @click="startAutoAnswer"
                :disabled="isAutoAnswering"
            >
                Автоматически ответить
            </v-btn>
            <v-list v-for="question in questions" :key="question.id">
                <v-card class="mb-4">
                    <v-card-title class="text-wrap">{{ question.questions }}</v-card-title>
                    
                    <div class="answers pl-4">
                        <v-radio-group v-model="selectedAnswers[question.id]">
                            <v-radio
                                v-for="answer in question.answers"
                                :key="answer.id"
                                :label="`${answer.id}: ${answer.answer} (${answer.points}) `"
                                :value="answer.points"
                            ></v-radio>
                        </v-radio-group>
                    </div>
                </v-card>
            </v-list>

            <v-btn 
                color="success" 
                type="submit"
                :disabled="isAutoAnswering"
            >
                {{ isAutoAnswering ? 'Автоответчик работает...' : 'Отправить' }}
            </v-btn>

            
        </v-form>
    </v-container>
</template>
<script>
import api from '@/services/api';

export default {
    data() {
        return {
            questions: [],
            loading: false,
            errors: '',
            selectedAnswers: {}, // Теперь хранит {questionId: {answerId, points}}
            secretKey: 'my-secret-key-123',
            isAutoAnswering: false,
            autoAnswerInterval: null,
            userData: null,
            answerDelay: 100
        }
    },
    created() {
        this.parseUserData();
    },
    computed: {
        testId() {
            console.log(this.$route.params)
            return this.$route.params.test_data
        }
    },
    mounted() {
        this.fetchQuestions();
    },
    beforeUnmount() {
        this.stopAutoAnswer();
    },
    methods: {
        async fetchQuestions() {
            try {
                this.loading = true;
                let response = await api.get(`/get_questions/${this.testId}`);
                this.questions = response.data;
                
                this.questions.forEach(q => {
                    this.selectedAnswers[q.id] = {answerId: null, points: null};
                });
            } catch (error) {
                console.error("Ошибка при загрузке вопросов:", error);
            } finally {
                this.loading = false;
            }
        },
        startAutoAnswer() {
            this.isAutoAnswering = true;
            let currentQuestionIndex = 0;
            
            this.autoAnswerInterval = setInterval(() => {
                if (currentQuestionIndex < this.questions.length) {
                    const question = this.questions[currentQuestionIndex];
                    
                    if (question.answers && question.answers.length > 0) {
                        const randomIndex = Math.floor(Math.random() * question.answers.length);
                        const selectedAnswer = question.answers[randomIndex];
                        this.selectedAnswers[question.id] = {
                            answerId: selectedAnswer.id,
                            points: selectedAnswer.points
                        };
                    }
                    
                    currentQuestionIndex++;
                } else {
                    this.stopAutoAnswer();
                    this.submitAnswers();
                }
            }, this.answerDelay);
        },
        stopAutoAnswer() {
            if (this.autoAnswerInterval) {
                clearInterval(this.autoAnswerInterval);
                this.autoAnswerInterval = null;
            }
            this.isAutoAnswering = false;
        },
        async submitAnswers() {
            try {
                this.loading = true;
                
                // Формируем данные для отправки с answer_id
                const answersData = {
                    test_id: this.testId,
                    answers: Object.entries(this.selectedAnswers)
                        .filter(([_, answer]) => answer.answerId !== null)
                        .map(([questionId, answer]) => ({
                            question_id: questionId, // если все же нужно сохранить и question_id
                            answer_id: answer.answerId,
                            points: answer.points
                        }))
                };

                answersData.user_data = this.userData;
                
                console.log('Отправляемые данные:', answersData);
                await api.post('/save_answers', answersData);
                alert('Ответы успешно отправлены!');
                
            } catch (error) {
                console.error("Ошибка при отправке ответов:", error);
                alert('Произошла ошибка при отправке ответов');
            } finally {
                this.loading = false;
            }
        },
        parseUserData() {
      // Если тест не анонимный и есть данные пользователя
      if (this.$route.query.userData) {
        try {
          // Декодируем и парсим данные
          this.userData = JSON.parse(decodeURIComponent(this.$route.query.userData));
          console.log('Данные пользователя:', this.userData);
          
          // Пример доступа к полям:
          console.log('ФИО:', 
            `${this.userData.lastName} ${this.userData.firstName} ${this.userData.middleName}`);
          
        } catch (error) {
          console.error('Ошибка декодирования данных пользователя:', error);
        }
      }
      
      // Проверяем анонимность теста
      this.testData = {
        isAnonymous: this.$route.query.anonymous === 'true',
        testId: this.$route.params.id
      };
    },
    }
}
</script>

<style scoped>
.answers {
    margin-left: 20px;
}
</style>