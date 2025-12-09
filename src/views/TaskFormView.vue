<script setup>
// import Vue helpers for lifecycle, reactive state, refs and computed values
import { onMounted, reactive, ref, computed } from 'vue'

// import hooks to read the route and navigate
import { useRoute, useRouter } from 'vue-router'

// import our stores to save tasks and load categories
import { useTasksStore } from '../stores/tasksStore'
import { useCategoriesStore } from '../stores/categoriesStore'

// get the current route object (to see if we are editing)
const route = useRoute()

// get router instance to go back or navigate after save
const router = useRouter()

// create store instances to use inside the form
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

// main form object, wrapped in reactive so fields are reactive
const form = reactive({
  id: null,
  title: '',
  description: '',
  priority: 'medium',
  categoryId: '',
  dueDate: '',
  completed: false,
})

// errors object for simple validation messages
const errors = reactive({
  title: '',
  categoryId: '',
})

// computed that tells us if this page is in edit mode (has id in URL)
const isEdit = computed(() => !!route.params.id)

// flag to show a small loading skeleton when loading task data for edit
const loadingInitial = ref(false)

// when the component mounts, load categories and maybe the existing task
onMounted(async () => {
  // make sure we have categories for the dropdown
  await categoriesStore.loadCategories()

  // if we are editing an existing task, load it
  if (isEdit.value) {
    loadingInitial.value = true
    try {
      // load the selected task by id from the route params
      await tasksStore.loadTask(route.params.id)
      if (tasksStore.selectedTask) {
        // copy all fields from the loaded task into the form
        const t = tasksStore.selectedTask
        form.id = t.id
        form.title = t.title
        form.description = t.description || ''
        form.priority = t.priority || 'medium'
        form.categoryId = t.category_id
        form.dueDate = t.due_date || ''
        form.completed = !!t.completed
      }
    } finally {
      // hide the loading skeleton
      loadingInitial.value = false
    }
  }
})

// simple validation for required fields
function validate() {
  let ok = true
  // reset any previous error messages
  errors.title = ''
  errors.categoryId = ''

  // title must not be empty or only spaces
  if (!form.title.trim()) {
    errors.title = 'Title is required'
    ok = false
  }

  // category must be selected
  if (!form.categoryId) {
    errors.categoryId = 'Category is required'
    ok = false
  }

  return ok
}

// handle form submit for create or update
async function onSubmit() {
  // if validation fails, stop here
  if (!validate()) return

  try {
    // call the store to save the task (create or update)
    const saved = await tasksStore.saveTask(form, isEdit.value)
    // after saving, go to the detail page of the saved task
    router.push({ name: 'task-detail', params: { id: saved.id } })
  } catch (err) {
    // simple error logging to console
    console.error(err)
  }
}

// handle cancel button click
function onCancel() {
  // if we were editing a task and still have its id, go back to its detail page
  if (isEdit.value && form.id) {
    router.push({ name: 'task-detail', params: { id: form.id } })
  } else {
    // otherwise go back to the main tasks list
    router.push({ name: 'tasks' })
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-5">
    <!-- header with back button and title -->
    <div class="flex items-center justify-between">
      <button
        class="text-xs text-slate-500 hover:text-slate-700"
        @click="onCancel"
      >
        ‹ Back
      </button>
      <h1 class="text-sm font-semibold text-slate-900">
        <span v-if="isEdit">Edit task</span>
        <span v-else>New task</span>
      </h1>
      <div class="w-10" />
    </div>

    <!-- main card with optional skeleton and the form -->
    <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <!-- small skeleton shown while loading task data for edit -->
      <div v-if="loadingInitial" class="space-y-3">
        <div class="h-4 w-32 rounded-full bg-slate-100 animate-pulse" />
        <div class="h-20 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
      </div>

      <!-- main form for creating or editing a task -->
      <form v-else class="space-y-4" @submit.prevent="onSubmit">
        <!-- title input and error message -->
        <div class="space-y-1 text-sm">
          <label class="block text-slate-700">Title *</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <p v-if="errors.title" class="text-xs text-red-500">{{ errors.title }}</p>
        </div>

        <!-- category dropdown and error message -->
        <div class="space-y-1 text-sm">
          <label class="block text-slate-700">Category *</label>
          <select
            v-model="form.categoryId"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="">Select category</option>
            <option
              v-for="cat in categoriesStore.items"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
          <p v-if="errors.categoryId" class="text-xs text-red-500">{{ errors.categoryId }}</p>
        </div>

        <!-- description textarea -->
        <div class="space-y-1 text-sm">
          <label class="block text-slate-700">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <!-- row with priority, due date and completed checkbox -->
        <div class="grid md:grid-cols-3 gap-3 text-sm">
          <!-- priority dropdown -->
          <div class="space-y-1">
            <label class="block text-slate-700">Priority</label>
            <select
              v-model="form.priority"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <!-- due date input -->
          <div class="space-y-1">
            <label class="block text-slate-700">Due date</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <!-- checkbox to mark task as completed -->
          <div class="flex items-center gap-2 mt-6">
            <input
              id="completed"
              v-model="form.completed"
              type="checkbox"
              class="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300"
            />
            <label for="completed" class="text-xs text-slate-600">Mark as completed</label>
          </div>
        </div>

        <!-- buttons row: Cancel and Save -->
        <div class="flex justify-end gap-2 pt-2 text-sm">
          <button
            type="button"
            class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            @click="onCancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-1.5 rounded-full bg-amber-400 text-slate-900 font-medium hover:bg-amber-300 disabled:opacity-60"
            :disabled="tasksStore.saving"
          >
            <span v-if="tasksStore.saving">Saving...</span>
            <span v-else>Save</span>
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
