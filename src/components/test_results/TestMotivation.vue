<template>
  <v-container>
    <v-tabs v-model="tab" grow>
      <v-tab value="list">Список мотиваций</v-tab>
      <v-tab value="stats">Статистика</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="list">
        <v-card class="mt-4">
          <v-card-title>
            Мотивации сотрудников
            <v-chip class="ml-2" color="info" small>
              Всего: {{ users.length }} (Все анонимны)
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-progress-linear
              v-if="loading"
              indeterminate
              color="primary"
            ></v-progress-linear>
            
            <v-list v-else>
              <template v-for="(user, userIndex) in users" :key="user.user_id">
                <v-list-item three-line>
                  <template v-slot:prepend>
                    <v-btn
                      icon
                      color="error"
                      size="small"
                      class="ml-2 mr-1"
                      @click="deleteUser(user.user_id)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                    
                    <v-avatar color="grey">
                      {{ userIndex + 1 }}
                    </v-avatar>
                  </template>

                  <v-list-item-title>
                    {{ user.user_name || 'Анонимный сотрудник' }}
                    
                  </v-list-item-title>

                  <v-list-item-subtitle>
                    <div v-if="user.motivations && user.motivations.length">
                        
                      <v-chip
                        v-for="(motivation, index) in user.motivations"
                        :key="motivation.id"
                        class="ma-1"
                        :color="getPriorityColor(index)"
                        small
                      >
                        {{ index + 1 }}. {{ motivation.text }}
                        <v-icon
                          small
                          class="ml-1"
                          @click="deleteMotivation(user.user_id, motivation.id)"
                        >
                          mdi-close
                        </v-icon>
                      </v-chip>
                      
                    </div>
                    <v-alert v-else type="info" density="compact">
                      Нет данных о мотивациях
                    </v-alert>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-divider v-if="userIndex < users.length - 1"></v-divider>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="stats">
        <StatisticsTab 
          :users="users"
          :loading="loading"
        />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script>
import * as echarts from 'echarts';
import api from '@/services/api';
import StatisticsTab from './StatisticsTab.vue';

export default {
  components: {
    StatisticsTab
  },
  data() {
    return {
      tab: 'list',
      users: [],
      loading: true,
    };
  },
  computed: {
    usersWithMotivations() {
      return this.users.filter(user => user.motivations?.length > 0);
    }
  },
  methods: {
    getPriorityColor(index) {
      const colors = ['primary', 'secondary', 'success'];
      return colors[index] || 'grey';
    },
    async fetchData() {
      try {
        this.loading = true;
        const response = await api.get(`/get_motivations/${JSON.parse(localStorage.getItem("user_info")).company_id}`);
        this.users = response.data;
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        this.loading = false;
      }
    },
    async deleteUser(userId) {
      try {
        this.loading = true;
        await api.delete(`/users/${userId}`);
        this.users = this.users.filter(user => user.user_id !== userId);
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
      } finally {
        this.loading = false;
      }
    },
    async deleteMotivation(userId, motivationId) {
      try {
        this.loading = true;
        await api.delete(`/users/${userId}/motivations/${motivationId}`);
        
        // Обновляем локальные данные без запроса к серверу
        this.users = this.users.map(user => {
          if (user.user_id === userId) {
            return {
              ...user,
              motivations: user.motivations.filter(m => m.id !== motivationId)
            };
          }
          return user;
        });
      } catch (error) {
        console.error('Ошибка удаления мотивации:', error);
      } finally {
        this.loading = false;
      }
    }
  },
  mounted() {
    this.fetchData();
  }
};
</script>

<style scoped>
.v-chip {
  cursor: default;
  position: relative;
}

.v-chip .v-icon {
  cursor: pointer;
  transition: opacity 0.2s;
  opacity: 0.5;
}

.v-chip:hover .v-icon {
  opacity: 1;
}
</style>