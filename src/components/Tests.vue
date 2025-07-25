<template>
    <v-container class="fill-height" max-width="900">
        <v-list three-line>
            <v-list-item v-for="test in tests" :key="test.id">
                {{ test.name }}
            </v-list-item>
        </v-list>
    </v-container>
</template>

<script>
    import api from '@/services/api';
    export default {
        data() {
            return {
                tests: [],
                loading: false,
                errors: ''
            }
        },
        mounted() {
            this.fetchTests()
        },
        methods: {
            async fetchTests() {
                this.loading = true;
                this.errors = '';
                try {
                    const response = await api.get('/get_tests');
                    this.tests = response.data;
                } catch (error) {
                    this.errors = 'Не удалось получить данные';
                } finally {
                    this.loading = false;
                }
            }
        }
    }
</script>