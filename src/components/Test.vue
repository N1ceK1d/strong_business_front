<template>
    <v-container>
        <v-form @submit.prevent="submitAnswers">
            <v-list v-for="question in questions" :key="question.id">
                <v-card class="mb-4">
                    <v-card-title class="text-wrap">{{ question.questions }}</v-card-title>
                    
                    <div class="answers pl-4">
                        <v-radio-group v-model="selectedAnswers[question.id]">
                            <v-radio
                                v-for="answer in question.answers"
                                :key="answer.id"
                                :label="`${answer.answer} (${answer.points})`"
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

            <v-btn 
                color="primary" 
                class="ml-2"
                @click="startAutoAnswer"
                :disabled="isAutoAnswering"
            >
                Автоматически ответить
            </v-btn>
        </v-form>
    </v-container>
</template>

<script>
import api from '@/services/api';
import CryptoJS from 'crypto-js';

export default {
    data() {
        return {
            questions: [],
            loading: false,
            errors: '',
            selectedAnswers: {},
            secretKey: 'my-secret-key-123',
            isAutoAnswering: false,
            autoAnswerInterval: null,
            answerDelay: 100 // 3 секунды между ответами
        }
    },
    created() {
        this.decryptData();
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
        this.stopAutoAnswer(); // Очищаем интервал при размонтировании
    },
    methods: {
        async fetchQuestions() {
            try {
                this.loading = true;
                let response = await api.get(`/get_questions/${this.testId}`);
                this.questions = response.data;
                
                // Инициализируем объект для хранения ответов
                this.questions.forEach(q => {
                    this.selectedAnswers[q.id] = null;
                });
            } catch (error) {
                console.error("Ошибка при загрузке вопросов:", error);
            } finally {
                this.loading = false;
            }
        },
        decryptData() {
      try {
        const encryptedData = decodeURIComponent(this.$route.params.data);
        const bytes = CryptoJS.AES.decrypt(encryptedData, this.secretKey);
        const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
        
        // Проверяем timestamp (например, чтобы ссылка была действительна 7 дней)
        const linkAge = Date.now() - decryptedData.timestamp;
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 дней
        
        if (linkAge > maxAge) {
          throw new Error('Ссылка устарела');
        }
        
        this.testData = decryptedData;
      } catch (error) {
        console.error('Ошибка расшифровки:', error);
        this.testData = null;
      }
    },

        startAutoAnswer() {
            this.isAutoAnswering = true;
            let currentQuestionIndex = 0;
            
            this.autoAnswerInterval = setInterval(() => {
                if (currentQuestionIndex < this.questions.length) {
                    const question = this.questions[currentQuestionIndex];
                    
                    // Выбираем случайный ответ
                    if (question.answers && question.answers.length > 0) {
                        const randomIndex = Math.floor(Math.random() * question.answers.length);
                        this.selectedAnswers[question.id] = question.answers[randomIndex].points;
                    }
                    
                    currentQuestionIndex++;
                } else {
                    this.stopAutoAnswer();
                    this.submitAnswers(); // Автоматически отправляем когда все ответы выбраны
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
                
                // Формируем данные для отправки
                const answersData = {
                    test_id: this.testId,
                    answers: Object.keys(this.selectedAnswers).map(questionId => ({
                        question_id: questionId,
                        points: this.selectedAnswers[questionId]
                    }))
                };
                console.log(answersData)
                //await api.post('/submit_answers', answersData);
                alert('Ответы успешно отправлены!');
                
            } catch (error) {
                console.error("Ошибка при отправке ответов:", error);
                alert('Произошла ошибка при отправке ответов');
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>

<style scoped>
.answers {
    margin-left: 20px;
}
</style>