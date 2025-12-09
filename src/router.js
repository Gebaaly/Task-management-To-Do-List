// import helpers to create a Vue Router instance
import { createRouter, createWebHistory } from 'vue-router'

// import the views used in the app
import TaskListView from './views/TaskListView.vue'
import TaskDetailView from './views/TaskDetailView.vue'
import TaskFormView from './views/TaskFormView.vue'
import MyTasksView from './views/MyTasksView.vue'

// define all routes the app supports
const routes = [
  // main page that shows the dashboard
  { path: '/', name: 'tasks', component: TaskListView },
  // page that shows all tasks in a table-like view
  { path: '/my-tasks', name: 'my-tasks', component: MyTasksView },
  // page to create a new task
  { path: '/tasks/new', name: 'task-new', component: TaskFormView },
  // page that shows a single task by id
  { path: '/tasks/:id', name: 'task-detail', component: TaskDetailView, props: true },
  // page to edit an existing task
  { path: '/tasks/:id/edit', name: 'task-edit', component: TaskFormView, props: true },
]

// create the router instance, using HTML5 history mode
const router = createRouter({
  history: createWebHistory(),
  routes,
})

// export it so main.js can use it
export default router
