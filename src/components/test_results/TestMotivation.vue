<template>
  <v-container>
    <v-dialog v-model="userDeleteDialog" persistent max-width="500">
      <v-card>
        <v-card-title class="headline">Подтверждение удаления</v-card-title>
        <v-card-text>
          Вы уверены, что хотите удалить все мотивации сотрудника 
          <strong>{{ userToDelete?.user_name || 'Анонимный сотрудник' }}</strong>?
          <br>Это действие нельзя будет отменить.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="userDeleteDialog = false">
            Отмена
          </v-btn>
          <v-btn color="error" text @click="deleteUser" :loading="deleteLoading">
            Удалить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
                      @click="openUserDeleteDialog(user)"
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
      userDeleteDialog: false,
      userToDelete: null,
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
    openUserDeleteDialog(user) {
      this.userToDelete = user;
      this.userDeleteDialog = true;
    },
    async deleteUser() {
      if (!this.userToDelete) return;
      
      this.deleteLoading = true;
      try {
        await api.delete('/delete_answers', { 
          data: { user_id: this.userToDelete.user_id }
        });
        this.fetchData();
        this.$toast.success('Мотивации сотрудника успешно удалены');
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        this.$toast.error('Ошибка при удалении мотиваций сотрудника');
      } finally {
        this.deleteLoading = false;
        this.userDeleteDialog = false;
        this.userToDelete = null;
      }
    },
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