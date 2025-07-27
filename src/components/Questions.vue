<template>
    <v-container>
        <v-form>
            <v-list v-for="question in this.questions" :key="question.id">
                <v-card>
                    <v-card-title>{{ question.questions }}</v-card-title>
                    
                    <div class="answers">
                        <v-list v-for="answer in question.answers" :key="answer.id">
                            <input type="radio" :name="question.id" :value="answer.answer.points">
                            {{ answer.answer }} ({{ answer.points }})
                        </v-list>
                    </div>
                </v-card>
            </v-list>
            <v-btn color="success">Отправить</v-btn>
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
            errors: ''
        }
    },
    mounted() {
        this.fetchQuestions()
    },
    methods: {
        async fetchQuestions() {
            try {
                this.loading = true;
                let response = await api.get('/get_questions/5');
                console.log(response.data);
                this.questions = response.data;
            } catch (error) {
                
            } finally {
                this.loading = false;
            }
        }
    }
}
</script>