<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasksStore'
import { useCategoriesStore } from '../stores/categoriesStore'

const route = useRoute()
const router = useRouter()
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

const form = reactive({
  id: null,
  title: '',
  description: '',
  priority: 'medium',
  categoryId: '',
  dueDate: '',
  completed: false,
})

const errors = reactive({
  title: '',
  categoryId: '',
})

const isEdit = computed(() => !!route.params.id)

const loadingInitial = ref(false)

onMounted(async () => {
  await categoriesStore.loadCategories()

  if (isEdit.value) {
    loadingInitial.value = true
    try {
      await tasksStore.loadTask(route.params.id)
      if (tasksStore.selectedTask) {
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
      loadingInitial.value = false
    }
  }
})

function validate() {
  let ok = true
  errors.title = ''
  errors.categoryId = ''

  if (!form.title.trim()) {
    errors.title = 'Title is required'
    ok = false
  }

  if (!form.categoryId) {
    errors.categoryId = 'Category is required'
    ok = false
  }

  return ok
}

async function onSubmit() {
  if (!validate()) return

  try {
    const saved = await tasksStore.saveTask(form, isEdit.value)
    router.push({ name: 'task-detail', params: { id: saved.id } })
  } catch (err) {
    console.error(err)
  }
}

function onCancel() {
  if (isEdit.value && form.id) {
    router.push({ name: 'task-detail', params: { id: form.id } })
  } else {
    router.push({ name: 'tasks' })
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto space-y-5">
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

    <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
      <div v-if="loadingInitial" class="space-y-3">
        <div class="h-4 w-32 rounded-full bg-slate-100 animate-pulse" />
        <div class="h-20 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse" />
      </div>

      <form v-else class="space-y-4" @submit.prevent="onSubmit">
        <div class="space-y-1 text-sm">
          <label class="block text-slate-700">Title *</label>
          <input
            v-model="form.title"
            type="text"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
          <p v-if="errors.title" class="text-xs text-red-500">{{ errors.title }}</p>
        </div>

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

        <div class="space-y-1 text-sm">
          <label class="block text-slate-700">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        <div class="grid md:grid-cols-3 gap-3 text-sm">
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

          <div class="space-y-1">
            <label class="block text-slate-700">Due date</label>
            <input
              v-model="form.dueDate"
              type="date"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

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
