// import defineStore helper from Pinia so we can create a store for tasks
import { defineStore } from 'pinia'

// import all the API methods we need to work with tasks on Supabase
import {
  fetchTasks,
  fetchTask,
  createTask,
  updateTask,
  deleteTask,
} from './supabaseClient'

// create and export a Pinia store named "tasks"
export const useTasksStore = defineStore('tasks', {
  // state holds all the reactive data for this store
  state: () => ({
    // list of task objects loaded from the backend
    items: [],
    // single task used on the detail and edit pages
    selectedTask: null,
    // loading flag for the task list
    loadingList: false,
    // loading flag for the single selected task
    loadingSelected: false,
    // flag to show when we are saving a task (create or update)
    saving: false,
    // flag to show when we are deleting a task
    deleting: false,
    // error message for the list view
    errorList: null,
    // error message for the selected task
    errorSelected: null,
    // current filters used on the task list
    filters: {
      // which category the user selected or "all"
      categoryId: 'all',
      // whether to show all / active / completed tasks
      completed: 'all',
      // which priority filter is active
      priority: 'all',
    },
  }),
  // actions are functions that can change state and call APIs
  actions: {
    // load tasks from the backend using the current filters
    async loadTasks() {
      // set loading flag so UI can show skeleton
      this.loadingList = true
      // clear old error
      this.errorList = null

      // build params object that we pass to fetchTasks
      const params = {}
      // apply category filter only when it is not "all"
      if (this.filters.categoryId && this.filters.categoryId !== 'all') {
        params.categoryId = this.filters.categoryId
      }
      // apply completed filter, converting from string to boolean
      if (this.filters.completed !== 'all') {
        params.completed = this.filters.completed === 'true'
      }
      // apply priority filter only when it is not "all"
      if (this.filters.priority !== 'all') {
        params.priority = this.filters.priority
      }

      try {
        // call Supabase REST API to get a list of tasks
        const data = await fetchTasks(params)
        // save the tasks into the store
        this.items = data
      } catch (err) {
        // keep a friendly error message for the UI
        this.errorList = err.message || 'Failed to load tasks'
      } finally {
        // stop showing the loading state
        this.loadingList = false
      }
    },
    // load a single task by id (for detail or edit)
    async loadTask(id) {
      // show loading state for the selected task
      this.loadingSelected = true
      // clear previous error and selected task
      this.errorSelected = null
      this.selectedTask = null

      try {
        // call API to get one task (Supabase returns an array)
        const data = await fetchTask(id)
        // take the first element or null if nothing came back
        this.selectedTask = data[0] || null
      } catch (err) {
        // store an error so the detail page can show it
        this.errorSelected = err.message || 'Failed to load task'
      } finally {
        // hide loading state when finished
        this.loadingSelected = false
      }
    },
    // create a new task or update an existing one using the form data
    async saveTask(form, isEdit) {
      // show saving state so the button can show "Saving..."
      this.saving = true
      // clear any old error related to saving
      this.errorSelected = null

      // build the payload expected by the Supabase REST API
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
        // if we are editing, send a PATCH request
        if (isEdit) {
          data = await updateTask(form.id, payload)
        } else {
          // otherwise, create a new task with POST
          data = await createTask(payload)
        }

        // Supabase returns an array, we just take the first task
        const task = data[0]

        // if it was a new task, add it to the top of the list
        if (!isEdit) {
          this.items.unshift(task)
        } else {
          // if it was an update, replace the old task in the list
          const index = this.items.findIndex((t) => t.id === task.id)
          if (index !== -1) {
            this.items.splice(index, 1, task)
          }
        }

        // keep the saved task in selectedTask so detail view can use it
        this.selectedTask = task
        // return it so the form page can redirect correctly
        return task
      } catch (err) {
        // store an error message and rethrow so the caller can handle it
        this.errorSelected = err.message || 'Failed to save task'
        throw err
      } finally {
        // stop showing the saving state
        this.saving = false
      }
    },
    // toggle the completed flag for a single task
    async toggleCompleted(task) {
      // create a copy of the task with completed switched
      const updated = { ...task, completed: !task.completed }
      try {
        // call update API with only the completed field
        const data = await updateTask(task.id, { completed: updated.completed })
        // Supabase returns the updated task in an array
        const saved = data[0]
        // find the index of the task in the list
        const index = this.items.findIndex((t) => t.id === task.id)
        if (index !== -1) {
          // replace the old task with the updated one
          this.items.splice(index, 1, saved)
        }
        // if the selectedTask is the same one, also update it
        if (this.selectedTask && this.selectedTask.id === task.id) {
          this.selectedTask = saved
        }
      } catch (err) {
        // here we just log the error; the UI stays as it was
        console.error(err)
      }
    },
    // delete a task by id
    async removeTask(id) {
      // show deleting state so the UI can disable buttons
      this.deleting = true
      // clear old error
      this.errorSelected = null
      try {
        // call the delete API on Supabase
        await deleteTask(id)
        // remove the task from the list in memory
        this.items = this.items.filter((t) => t.id !== id)
        // if the deleted task is currently selected, clear it
        if (this.selectedTask && this.selectedTask.id === id) {
          this.selectedTask = null
        }
      } catch (err) {
        // store an error so the UI can show a message
        this.errorSelected = err.message || 'Failed to delete task'
        throw err
      } finally {
        // stop showing deleting state
        this.deleting = false
      }
    },
    // update one of the filter values from the UI
    setFilter(name, value) {
      this.filters[name] = value
    },
  },
})
