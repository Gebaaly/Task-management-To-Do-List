import { defineStore } from 'pinia'

import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
} from './supabaseClient'

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    items: [],
    selectedTask: null,
    loadingList: false,
    loadingSelected: false,
    saving: false,
    deleting: false,
    errorList: null,
    errorSelected: null,
    filters: {
      categoryId: 'all',
      completed: 'all',
      priority: 'all',
    },
  }),
  actions: {
    async loadTasks() {
      this.loadingList = true
      this.errorList = null

      const params = {}
      if (this.filters.categoryId && this.filters.categoryId !== 'all') {
        params.categoryId = this.filters.categoryId
      }
      if (this.filters.completed !== 'all') {
        params.completed = this.filters.completed === 'true'
      }
      if (this.filters.priority !== 'all') {
        params.priority = this.filters.priority
      }

      try {
        const data = await fetchTasks(params)
        this.items = data
      } catch (err) {
        this.errorList = err.message || 'Failed to load tasks'
      } finally {
        this.loadingList = false
      }
    },
    async loadTask(id) {
      this.loadingSelected = true
      this.errorSelected = null
      this.selectedTask = null

      try {
        const data = await fetchTask(id)
        this.selectedTask = data[0] || null
      } catch (err) {
        this.errorSelected = err.message || 'Failed to load task'
      } finally {
        this.loadingSelected = false
      }
    },
    async saveTask(form, isEdit) {
      this.saving = true
      this.errorSelected = null

      const payload = {
        title: form.title,
        description: form.description || null,
        priority: form.priority || null,
        category_id: form.categoryId,
        due_date: form.dueDate || null,
        completed: !!form.completed,
      }

      try {
        let data
        if (isEdit) {
          data = await updateTask(form.id, payload)
        } else {
          data = await createTask(payload)
        }

        const task = data[0]

        if (!isEdit) {
          this.items.unshift(task)
        } else {
          const index = this.items.findIndex((t) => t.id === task.id)
          if (index !== -1) {
            this.items.splice(index, 1, task)
          }
        }

        this.selectedTask = task
        return task
      } catch (err) {
        this.errorSelected = err.message || 'Failed to save task'
        throw err
      } finally {
        this.saving = false
      }
    },
    async toggleCompleted(task) {
      const updated = { ...task, completed: !task.completed }
      try {
        const data = await updateTask(task.id, { completed: updated.completed })
        const saved = data[0]
        const index = this.items.findIndex((t) => t.id === task.id)
        if (index !== -1) {
          this.items.splice(index, 1, saved)
        }
        if (this.selectedTask && this.selectedTask.id === task.id) {
          this.selectedTask = saved
        }
      } catch (err) {
        console.error(err)
      }
    },
    async removeTask(id) {
      this.deleting = true
      this.errorSelected = null
      try {
        await deleteTask(id)
        this.items = this.items.filter((t) => t.id !== id)
        if (this.selectedTask && this.selectedTask.id === id) {
          this.selectedTask = null
        }
      } catch (err) {
        this.errorSelected = err.message || 'Failed to delete task'
        throw err
      } finally {
        this.deleting = false
      }
    },
    setFilter(name, value) {
      this.filters[name] = value
    },
  },
})
