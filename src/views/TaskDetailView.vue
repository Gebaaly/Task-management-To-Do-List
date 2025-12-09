<script setup>
// import Vue helpers for lifecycle, computed values and refs
import { onMounted, computed, ref } from 'vue'

// import hooks to read route params and navigate
import { useRoute, useRouter } from 'vue-router'

// import our Pinia stores for tasks and categories
import { useTasksStore } from '../stores/tasksStore'
import { useCategoriesStore } from '../stores/categoriesStore'

// get the current route (to read the task id from the URL)
const route = useRoute()

// get router instance so we can navigate to other pages
const router = useRouter()

// create store instances to use inside this view
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

// flag that controls whether the delete confirmation dialog is open
const confirmingDelete = ref(false)

// when the component mounts, load the task and categories
onMounted(() => {
  // read the id from the route params
  const id = route.params.id
  // make sure categories are loaded so we can display category info
  categoriesStore.loadCategories()
  // load the selected task from the API
  tasksStore.loadTask(id)
})

// computed value that always returns the current selected task
const task = computed(() => tasksStore.selectedTask)

// computed value for the category of the selected task
const category = computed(() => {
  // if there is no task yet, there is no category
  if (!task.value) return null
  // look up the category by the category_id field on the task
  return categoriesStore.getById(task.value.category_id)
})

// go back to the task list page
function goBack() {
  router.push({ name: 'tasks' })
}

// navigate to the edit page for this task
function goEdit() {
  // if task is not loaded yet, do nothing
  if (!task.value) return
  // push the edit route with the current task id
  router.push({ name: 'task-edit', params: { id: task.value.id } })
}

// toggle the completion status for this task
async function toggleCompleted() {
  // if no task loaded, do nothing
  if (!task.value) return
  // call the store action that flips completed and saves
  await tasksStore.toggleCompleted(task.value)
}

// open the delete confirmation dialog
function askDelete() {
  confirmingDelete.value = true
}

// close the delete confirmation dialog
function cancelDelete() {
  confirmingDelete.value = false
}

// actually delete the task after user confirms
async function confirmDelete() {
  // if there is no task loaded, do nothing
  if (!task.value) return
  try {
    // call the store to delete the task on Supabase
    await tasksStore.removeTask(task.value.id)
    // after deleting, go back to the list page
    router.push({ name: 'tasks' })
  } catch (err) {
    // simple error logging to the console
    console.error(err)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <!-- top bar with back button and edit/delete actions -->
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

    <!-- main content area -->
    <main class="bg-white rounded-3xl shadow-sm border border-slate-100 px-6 py-5">
      <!-- loading state while the task is fetched -->
      <div v-if="tasksStore.loadingSelected" class="space-y-4">
        <div class="h-6 w-40 bg-slate-100 rounded-full animate-pulse" />
        <div class="h-4 w-28 bg-slate-100 rounded-full animate-pulse" />
        <div class="h-40 bg-slate-50 rounded-2xl border border-slate-100 animate-pulse" />
      </div>

      <!-- error state with retry button -->
      <div v-else-if="tasksStore.errorSelected" class="max-w-md">
        <p class="text-sm text-red-500 mb-2">{{ tasksStore.errorSelected }}</p>
        <button
          class="text-xs px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-50"
          @click="() => tasksStore.loadTask(route.params.id)"
        >
          Retry
        </button>
      </div>

      <!-- state when no task is found -->
      <div v-else-if="!task" class="text-sm text-slate-400">
        Task not found.
      </div>

      <!-- normal state: show task details -->
      <article v-else class="space-y-4">
        <!-- top row: title, category info and toggle button -->
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

        <!-- layout: description and status only (no image) -->
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

    <!-- delete confirmation dialog overlay -->
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
