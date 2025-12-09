import { createRouter, createWebHistory } from 'vue-router'

import TaskListView from './views/TaskListView.vue'
import TaskDetailView from './views/TaskDetailView.vue'
import TaskFormView from './views/TaskFormView.vue'
import MyTasksView from './views/MyTasksView.vue'

const routes = [
  { path: '/', name: 'tasks', component: TaskListView },
  { path: '/my-tasks', name: 'my-tasks', component: MyTasksView },
  { path: '/tasks/new', name: 'task-new', component: TaskFormView },
  { path: '/tasks/:id', name: 'task-detail', component: TaskDetailView, props: true },
  { path: '/tasks/:id/edit', name: 'task-edit', component: TaskFormView, props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
