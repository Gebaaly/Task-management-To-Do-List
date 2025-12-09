<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTasksStore } from '../stores/tasksStore'
import { useCategoriesStore } from '../stores/categoriesStore'

const route = useRoute()
const router = useRouter()

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

const confirmingDelete = ref(false)

onMounted(() => {
  const id = route.params.id
  categoriesStore.loadCategories()
  tasksStore.loadTask(id)
})

const task = computed(() => tasksStore.selectedTask)

const category = computed(() => {
  if (!task.value) return null
  return categoriesStore.getById(task.value.category_id)
})

function goBack() {
  router.push({ name: 'tasks' })
}

function goEdit() {
  if (!task.value) return
  router.push({ name: 'task-edit', params: { id: task.value.id } })
}

async function toggleCompleted() {
  if (!task.value) return
  await tasksStore.toggleCompleted(task.value)
}

function askDelete() {
  confirmingDelete.value = true
}

function cancelDelete() {
  confirmingDelete.value = false
}

async function confirmDelete() {
  if (!task.value) return
  try {
    await tasksStore.removeTask(task.value.id)
    router.push({ name: 'tasks' })
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <div class="flex items-center justify-between pt-1">
      <button
        class="text-xs text-slate-500 hover:text-slate-700"
        @click="goBack"
      >
        ‹ Back
      </button>
      <div class="flex items-center gap-2">
        <button
          class="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
          @click="goEdit"
          :disabled="!task"
        >
          Edit
        </button>
        <button
          class="text-xs px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
          @click="askDelete"
          :disabled="!task"
        >
          Delete
        </button>
      </div>
    </div>

    <main class="bg-white rounded-3xl shadow-sm border border-slate-100 px-6 py-5">
      <div v-if="tasksStore.loadingSelected" class="space-y-4">
        <div class="h-6 w-40 bg-slate-100 rounded-full animate-pulse" />
        <div class="h-4 w-28 bg-slate-100 rounded-full animate-pulse" />
        <div class="h-40 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
      </div>

      <div v-else-if="tasksStore.errorSelected" class="max-w-md">
        <p class="text-sm text-red-500 mb-2">{{ tasksStore.errorSelected }}</p>
        <button
          class="text-xs px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-50"
          @click="() => tasksStore.loadTask(route.params.id)"
        >
          Retry
        </button>
      </div>

      <div v-else-if="!task" class="text-sm text-slate-400">
        Task not found.
      </div>

      <article v-else class="space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-2xl font-semibold mb-1 text-slate-900">{{ task.title }}</h1>
            <div class="flex items-center gap-2 text-xs text-slate-500">
              <span
                v-if="category"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: category.color }"
                />
                {{ category.name }}
              </span>
              <span v-if="task.priority" class="uppercase tracking-wide text-slate-500">
                {{ task.priority }} priority
              </span>
              <span v-if="task.due_date" class="text-slate-400">Due {{ task.due_date }}</span>
            </div>
          </div>
          <button
            class="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            @click="toggleCompleted"
          >
            <span v-if="task.completed">Mark as active</span>
            <span v-else>Mark as completed</span>
          </button>
        </div>

        <div class="space-y-3 text-sm">
          <div>
            <p class="text-slate-400 mb-1">Description</p>
            <p v-if="task.description" class="text-slate-700">{{ task.description }}</p>
            <p v-else class="text-slate-400 text-xs">No description provided.</p>
          </div>
          <div>
            <p class="text-slate-400 mb-1">Status</p>
            <p class="text-xs">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full border"
                :class="task.completed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'"
              >
                <span v-if="task.completed">Completed</span>
                <span v-else>Active</span>
              </span>
            </p>
          </div>
        </div>
      </article>
    </main>

    <div
      v-if="confirmingDelete"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-20"
    >
      <div class="bg-white border border-slate-200 rounded-2xl p-4 max-w-sm w-full mx-4 shadow-lg">
        <p class="text-sm mb-3 text-slate-800">Are you sure you want to delete this task?</p>
        <div class="flex justify-end gap-2 text-xs">
          <button
            class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            @click="cancelDelete"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
            :disabled="tasksStore.deleting"
            @click="confirmDelete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
