<script setup>
// import Vue helpers for lifecycle, reactive refs and computed properties
import { onMounted, computed, ref, reactive } from 'vue'

// import router and route hooks so we can navigate and read query params
import { useRouter, useRoute } from 'vue-router'

// import our Pinia stores for tasks and categories
import { useTasksStore } from '../stores/tasksStore'
import { useCategoriesStore } from '../stores/categoriesStore'

// import the TaskCard component that shows each task in the grid
import TaskCard from '../components/TaskCard.vue'

// create store instances so we can use them in this component
const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()

// state for simple modal when user clicks a task card
const showDetailModal = ref(false)
const selectedTaskForModal = ref(null)
const confirmingDeleteFromModal = ref(false)
const isEditingModal = ref(false)

// local form state for editing inside the modal
const modalForm = reactive({
  id: null,
  title: '',
  description: '',
  priority: 'medium',
  categoryId: '',
  dueDate: '',
  completed: false,
})

// state and form for creating a new task from dashboard
const showCreateModal = ref(false)
const createForm = reactive({
  title: '',
  description: '',
  priority: 'medium',
  categoryId: '',
  dueDate: '',
  completed: false,
})

// get the router instance to push new routes and current route for query params
const router = useRouter()
const route = useRoute()

// when the component is mounted, load categories and tasks
onMounted(() => {
  // load all categories from the API
  categoriesStore.loadCategories()
  // load tasks with the current filters
  tasksStore.loadTasks()
})

// local search text for tasks
const searchQuery = ref('')

// computed helper to return tasks filtered by search query
const filteredTasks = computed(() => {
  // if search is empty, return all tasks
  if (!searchQuery.value.trim()) {
    return tasksStore.items
  }

  const q = searchQuery.value.toLowerCase()

  // match if the query exists in the title or description
  return tasksStore.items.filter((task) => {
    const title = (task.title || '').toLowerCase()
    const description = (task.description || '').toLowerCase()
    return title.includes(q) || description.includes(q)
  })
})

// simple pagination state for dashboard tasks (separate for active / completed)
const activePage = ref(1)
const completedPage = ref(1)
const pageSize = 20

// all active / completed tasks after filters and search
const allActiveTasks = computed(() => filteredTasks.value.filter((t) => !t.completed))
const allCompletedTasks = computed(() => filteredTasks.value.filter((t) => !!t.completed))

// total pages for each list
const activeTotalPages = computed(() => {
  if (!allActiveTasks.value.length) return 1
  return Math.ceil(allActiveTasks.value.length / pageSize)
})

const completedTotalPages = computed(() => {
  if (!allCompletedTasks.value.length) return 1
  return Math.ceil(allCompletedTasks.value.length / pageSize)
})

// tasks on the current page for each list
const activeTasks = computed(() => {
  const start = (activePage.value - 1) * pageSize
  const end = start + pageSize
  return allActiveTasks.value.slice(start, end)
})

const completedTasks = computed(() => {
  const start = (completedPage.value - 1) * pageSize
  const end = start + pageSize
  return allCompletedTasks.value.slice(start, end)
})

// helper to know if we have any tasks after filtering
const hasTasks = computed(() => filteredTasks.value.length > 0)

// open the create-task modal instead of navigating to a new page
function onAddTask() {
  createForm.title = ''
  createForm.description = ''
  createForm.priority = 'medium'
  createForm.categoryId = ''
  createForm.dueDate = ''
  createForm.completed = false
  showCreateModal.value = true
}

// reload tasks again if something went wrong
function onRetry() {
  activePage.value = 1
  completedPage.value = 1
  tasksStore.loadTasks()
}

// whenever a filter changes, reload the task list
function onFilterChange() {
  activePage.value = 1
  completedPage.value = 1
  tasksStore.loadTasks()
}

// change current page for active / completed pagination controls
function goToActivePage(page) {
  if (page < 1) return
  if (page > activeTotalPages.value) return
  activePage.value = page
}

function goToCompletedPage(page) {
  if (page < 1) return
  if (page > completedTotalPages.value) return
  completedPage.value = page
}

// open modal with task details from dashboard
function openTaskFromDashboard(task) {
  selectedTaskForModal.value = task
  showDetailModal.value = true
  isEditingModal.value = false

  // copy fields into modal form for possible editing
  modalForm.id = task.id
  modalForm.title = task.title || ''
  modalForm.description = task.description || ''
  modalForm.priority = task.priority || 'medium'
  modalForm.categoryId = task.category_id
  modalForm.dueDate = task.due_date || ''
  modalForm.completed = !!task.completed
}

function closeTaskModal() {
  showDetailModal.value = false
  selectedTaskForModal.value = null
  confirmingDeleteFromModal.value = false
  isEditingModal.value = false
}

async function toggleCompletedFromModal() {
  if (!selectedTaskForModal.value) return
  await tasksStore.toggleCompleted(selectedTaskForModal.value)
  // refresh selected task reference from store so UI reflects latest state
  const updated = tasksStore.items.find((t) => t.id === selectedTaskForModal.value.id)
  if (updated) {
    selectedTaskForModal.value = updated
  }
}

function startEditInModal() {
  if (!selectedTaskForModal.value) return
  isEditingModal.value = true
}

function askDeleteFromModal() {
  confirmingDeleteFromModal.value = true
}

async function confirmDeleteFromModal() {
  if (!selectedTaskForModal.value) return
  try {
    await tasksStore.removeTask(selectedTaskForModal.value.id)
    closeTaskModal()
  } catch (err) {
    console.error(err)
  }
}

function cancelDeleteFromModal() {
  confirmingDeleteFromModal.value = false
}

async function saveModalEdit() {
  // simple validation like the main form
  if (!modalForm.title.trim()) return
  if (!modalForm.categoryId) return

  try {
    await tasksStore.saveTask(modalForm, !!modalForm.id)
    // reload tasks list to reflect changes
    await tasksStore.loadTasks()
    isEditingModal.value = false
    // keep modal open but selectedTask will be updated from store items next time
  } catch (err) {
    console.error(err)
  }
}

function cancelModalEdit() {
  if (!selectedTaskForModal.value) {
    isEditingModal.value = false
    return
  }
  // reset form back from selected task
  const t = selectedTaskForModal.value
  modalForm.title = t.title || ''
  modalForm.description = t.description || ''
  modalForm.priority = t.priority || 'medium'
  modalForm.categoryId = t.category_id
  modalForm.dueDate = t.due_date || ''
  modalForm.completed = !!t.completed
  isEditingModal.value = false
}

// save a new task from the create modal
async function saveCreateTask() {
  if (!createForm.title.trim()) return
  if (!createForm.categoryId) return

  try {
    await tasksStore.saveTask(createForm, false)
    await tasksStore.loadTasks()
    showCreateModal.value = false
  } catch (err) {
    console.error(err)
  }
}

function cancelCreateTask() {
  showCreateModal.value = false
}
</script>

<template>
  <div class="space-y-5">
    <!-- header area inside dashboard -->
    <div class=" space-y-4">
      <div class="p-5 flex items-end justify-between gap-4">
        <div>
          <h1 class=" text-xl font-bold text-slate-900">Tasky</h1>
        </div>
        <button
          class="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-medium text-slate-900 shadow-sm hover:bg-amber-300"
          @click="onAddTask"
        >
          + Add task
        </button>
      </div>

      <!-- filters row across the top -->
      <section class="bg-white rounded-3xl shadow-sm border border-slate-100 px-5 py-4 flex flex-wrap items-end gap-4 text-xs">
        <div class="space-y-1 min-w-[140px]">
          <p class="font-medium text-slate-700">Category</p>
          <select
            v-model="tasksStore.filters.categoryId"
            @change="onFilterChange"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="all">All</option>
            <option
              v-for="cat in categoriesStore.items"
              :key="cat.id"
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="space-y-1 min-w-[140px]">
          <p class="font-medium text-slate-700">Priority</p>
          <select
            v-model="tasksStore.filters.priority"
            @change="onFilterChange"
            class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="all">All</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div class="ml-auto w-full sm:w-56">
          <p class="font-medium text-slate-700 mb-1">Search</p>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search tasks..."
            class="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>
      </section>
    </div>
    
    <!-- loading / error / empty states for whole dashboard -->
    <div v-if="tasksStore.loadingList" class="grid gap-5 lg:grid-cols-2 mt-4">
      <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-3">
        <div class="h-4 w-32 rounded-full bg-slate-100 animate-pulse" />
        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="n in 4"
            :key="n"
            class="h-32 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse"
          />
        </div>
      </section>
      <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 space-y-3">
        <div class="h-4 w-32 rounded-full bg-slate-100 animate-pulse" />
        <div class="grid gap-3 md:grid-cols-2">
          <div
            v-for="n in 4"
            :key="n"
            class="h-32 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse"
          />
        </div>
      </section>
    </div>
    <div v-else-if="tasksStore.errorList" class="max-w-md mt-4">
      <p class="text-xs text-red-500 mb-2">{{ tasksStore.errorList }}</p>
      <button
        class="text-xs px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-50"
        @click="onRetry"
      >
        Retry
      </button>
    </div>
    <div v-else-if="!hasTasks" class="text-center mt-8 text-xs">
      <p class="text-slate-400 mb-3">No tasks found. Try changing your filters or create a new task.</p>
      <button
        class="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-medium text-slate-900 hover:bg-amber-300"
        @click="onAddTask"
      >
        Add task
      </button>
    </div>
    <!-- main grid: left for active tasks, right for completed tasks -->
    <div v-else class="mt-4">
      <div class="grid gap-5 lg:grid-cols-2">
        <!-- Active tasks column -->
        <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="text-sm font-semibold text-slate-800">Active tasks</h2>
              <p class="text-[11px] text-slate-400">{{ activeTasks.length }} active task(s).</p>
            </div>
          </div>

          <div v-if="!activeTasks.length" class="text-xs text-slate-400 text-center mt-4">
            No active tasks.
          </div>
          <div v-else class="mt-1">
            <div class="grid gap-3 md:grid-cols-2">
              <TaskCard
                v-for="task in activeTasks"
                :key="task.id"
                :task="task"
                :category="categoriesStore.getById(task.category_id)"
                @open="openTaskFromDashboard"
              />
            </div>
          </div>
          <!-- active tasks pagination -->
          <div
            v-if="allActiveTasks.length > pageSize"
            class="mt-4 flex items-center justify-center gap-2 text-[11px]"
          >
            <button
              class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="activePage === 1"
              @click="goToActivePage(activePage - 1)"
            >
              Previous
            </button>
            <span class="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
              Page {{ activePage }} of {{ activeTotalPages }}
            </span>
            <button
              class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="activePage === activeTotalPages"
              @click="goToActivePage(activePage + 1)"
            >
              Next
            </button>
          </div>
        </section>

        <!-- Completed tasks column -->
        <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 flex flex-col">
          <div class="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 class="text-sm font-semibold text-slate-800">Completed tasks</h2>
              <p class="text-[11px] text-slate-400">{{ completedTasks.length }} completed task(s).</p>
            </div>
          </div>

          <div v-if="!completedTasks.length" class="text-xs text-slate-400 text-center mt-4">
            No completed tasks yet.
          </div>
          <div v-else class="mt-1">
            <div class="grid gap-3 md:grid-cols-2">
              <TaskCard
                v-for="task in completedTasks"
                :key="task.id"
                :task="task"
                :category="categoriesStore.getById(task.category_id)"
                @open="openTaskFromDashboard"
              />
            </div>
          </div>
          <!-- completed tasks pagination -->
          <div
            v-if="allCompletedTasks.length > pageSize"
            class="mt-4 flex items-center justify-center gap-2 text-[11px]"
          >
            <button
              class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="completedPage === 1"
              @click="goToCompletedPage(completedPage - 1)"
            >
              Previous
            </button>
            <span class="px-3 py-1.5 rounded-full bg-slate-100 text-slate-700">
              Page {{ completedPage }} of {{ completedTotalPages }}
            </span>
            <button
              class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              :disabled="completedPage === completedTotalPages"
              @click="goToCompletedPage(completedPage + 1)"
            >
              Next
            </button>
          </div>
        </section>
      </div>
    </div>

    <!-- modal with full task details and actions -->
    <div
      v-if="showDetailModal && selectedTaskForModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-30"
    >
      <div class="bg-white rounded-3xl shadow-lg border border-slate-100 max-w-lg w-full mx-4 p-6 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900 mb-1">
              {{ selectedTaskForModal.title || 'Untitled task' }}
            </h2>
            <div class="flex items-center gap-2 text-[11px] text-slate-500">
              <span
                v-if="categoriesStore.getById(selectedTaskForModal.category_id)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50"
              >
                <span
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: categoriesStore.getById(selectedTaskForModal.category_id).color }"
                />
                {{ categoriesStore.getById(selectedTaskForModal.category_id).name }}
              </span>
              <span v-if="selectedTaskForModal.priority" class="uppercase tracking-wide">
                {{ selectedTaskForModal.priority }} priority
              </span>
              <span v-if="selectedTaskForModal.due_date" class="text-slate-400">
                Due {{ selectedTaskForModal.due_date }}
              </span>
            </div>
          </div>
          <button
            class="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            @click="closeTaskModal"
          >
            ✕
          </button>
        </div>

        <div class="text-sm space-y-3">
          <div v-if="!isEditingModal">
            <p class="text-slate-400 mb-1">Description</p>
            <p v-if="selectedTaskForModal.description" class="text-slate-700">
              {{ selectedTaskForModal.description }}
            </p>
            <p v-else class="text-slate-400 text-xs">No description provided.</p>
          </div>
          <div v-else>
            <p class="text-slate-400 mb-1">Description</p>
            <textarea
              v-model="modalForm.description"
              rows="3"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div v-if="!isEditingModal" class="space-y-2">
            <p class="text-slate-400 mb-1">Status</p>
            <div class="flex items-center gap-3">
              <!-- small badge showing current state -->
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full border text-[11px]"
                :class="selectedTaskForModal.completed
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'"
              >
                <span v-if="selectedTaskForModal.completed">Done</span>
                <span v-else>Active</span>
              </span>

              <!-- two checkbox-style buttons to switch between Active / Done -->
              <div class="flex items-center gap-2 text-[11px]">
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium transition"
                  :class="!selectedTaskForModal.completed
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
                  @click="!selectedTaskForModal.completed ? null : toggleCompletedFromModal()"
                >
                  <span
                    class="inline-flex h-3 w-3 items-center justify-center rounded border"
                    :class="!selectedTaskForModal.completed
                      ? 'border-emerald-400 bg-emerald-300'
                      : 'border-slate-300 bg-white'"
                  >
                    <span
                      v-if="!selectedTaskForModal.completed"
                      class="block h-1.5 w-1.5 rounded bg-emerald-700"
                    />
                  </span>
                  <span>Active</span>
                </button>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-medium transition"
                  :class="selectedTaskForModal.completed
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
                  @click="selectedTaskForModal.completed ? null : toggleCompletedFromModal()"
                >
                  <span
                    class="inline-flex h-3 w-3 items-center justify-center rounded border"
                    :class="selectedTaskForModal.completed
                      ? 'border-emerald-400 bg-emerald-300'
                      : 'border-slate-300 bg-white'"
                  >
                    <span
                      v-if="selectedTaskForModal.completed"
                      class="block h-1.5 w-1.5 rounded bg-emerald-700"
                    />
                  </span>
                  <span>Done</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="grid grid-cols-2 gap-3 text-xs mt-2">
            <div class="space-y-1">
              <p class="text-slate-700">Title *</p>
              <input
                v-model="modalForm.title"
                type="text"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div class="space-y-1">
              <p class="text-slate-700">Category *</p>
              <select
                v-model="modalForm.categoryId"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
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
            </div>
            <div class="space-y-1">
              <p class="text-slate-700">Priority</p>
              <select
                v-model="modalForm.priority"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="space-y-1">
              <p class="text-slate-700">Due date</p>
              <input
                v-model="modalForm.dueDate"
                type="date"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center pt-2 text-[11px]">
          <div v-if="confirmingDeleteFromModal" class="flex items-center gap-2 text-red-600">
            <span>Delete this task?</span>
            <button
              class="px-2 py-1 rounded-full bg-red-500 text-white hover:bg-red-600 disabled:opacity-60"
              :disabled="tasksStore.deleting"
              @click="confirmDeleteFromModal"
            >
              Yes, delete
            </button>
            <button
              class="px-2 py-1 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              @click="cancelDeleteFromModal"
            >
              Cancel
            </button>
          </div>
          <div v-else />

          <div class="flex items-center gap-2 ml-auto">
            <button
              class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              @click="closeTaskModal"
            >
              Close
            </button>
            <button
              v-if="!isEditingModal"
              class="px-3 py-1.5 rounded-full bg-amber-400 text-slate-900 font-medium hover:bg-amber-300"
              @click="startEditInModal"
            >
              Edit
            </button>
            <button
              v-else
              class="px-3 py-1.5 rounded-full bg-amber-400 text-slate-900 font-medium hover:bg-amber-300"
              @click="saveModalEdit"
            >
              Save
            </button>
            <button
              v-if="isEditingModal"
              class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
              @click="cancelModalEdit"
            >
              Cancel edit
            </button>
            <button
              v-if="!isEditingModal"
              class="px-3 py-1.5 rounded-full bg-red-500 text-white hover:bg-red-600"
              @click="askDeleteFromModal"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- create-task modal -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-30"
    >
      <div class="bg-white rounded-3xl shadow-lg border border-slate-100 max-w-lg w-full mx-4 p-6 space-y-4">
        <div class="flex items-start justify-between gap-4">
          <h2 class="text-lg font-semibold text-slate-900">New task</h2>
          <button
            class="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            @click="cancelCreateTask"
          >
            ✕
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div class="space-y-1">
            <p class="text-slate-700">Title *</p>
            <input
              v-model="createForm.title"
              type="text"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div class="space-y-1">
            <p class="text-slate-700">Category *</p>
            <select
              v-model="createForm.categoryId"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
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
          </div>

          <div class="space-y-1">
            <p class="text-slate-700">Description</p>
            <textarea
              v-model="createForm.description"
              rows="3"
              class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <p class="text-slate-700">Priority</p>
              <select
                v-model="createForm.priority"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="space-y-1">
              <p class="text-slate-700">Due date</p>
              <input
                v-model="createForm.dueDate"
                type="date"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2 text-[11px]">
          <button
            class="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
            @click="cancelCreateTask"
          >
            Cancel
          </button>
          <button
            class="px-3 py-1.5 rounded-full bg-amber-400 text-slate-900 font-medium hover:bg-amber-300"
            @click="saveCreateTask"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
