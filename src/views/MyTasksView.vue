<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTasksStore } from '../stores/tasksStore'
import { useCategoriesStore } from '../stores/categoriesStore'

const tasksStore = useTasksStore()
const categoriesStore = useCategoriesStore()
const route = useRoute()

const searchQuery = ref(route.query.q || '')

const page = ref(1)
const pageSize = 20

onMounted(() => {
  categoriesStore.loadCategories()
  tasksStore.loadTasks()
})

watch(
  () => route.query.q,
  (val) => {
    searchQuery.value = val || ''
  }
)

const filteredTasks = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return tasksStore.items
  return tasksStore.items.filter((task) => {
    const title = (task.title || '').toLowerCase()
    const description = (task.description || '').toLowerCase()
    return title.includes(q) || description.includes(q)
  })
})

const pagedTasks = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredTasks.value.slice(start, start + pageSize)
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTasks.value.length / pageSize)))

function goPage(direction) {
  if (direction === 'prev' && page.value > 1) page.value--
  if (direction === 'next' && page.value < totalPages.value) page.value++
}

function categoryFor(task) {
  return categoriesStore.getById(task.category_id)
}
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-xl font-semibold text-slate-900">My tasks</h1>
      <p class="text-xs text-slate-500 mt-1">All tasks from your Supabase project.</p>
    </div>

    <section class="bg-white rounded-3xl shadow-sm border border-slate-100 p-5">
      <div class="flex items-center justify-between mb-4 text-xs text-slate-500">
        <p>{{ filteredTasks.length }} task(s)</p>
      </div>

      <div v-if="tasksStore.loadingList" class="space-y-2">
        <div class="h-4 w-32 rounded-full bg-slate-100 animate-pulse" />
        <div
          v-for="n in 4"
          :key="n"
          class="h-10 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse"
        />
      </div>

      <div v-else-if="tasksStore.errorList" class="max-w-md text-xs">
        <p class="text-red-500 mb-2">{{ tasksStore.errorList }}</p>
        <button
          class="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 hover:bg-slate-50"
          @click="tasksStore.loadTasks()"
        >
          Retry
        </button>
      </div>

      <div v-else-if="!filteredTasks.length" class="text-xs text-slate-400 text-center py-6">
        No tasks to show.
      </div>

      <div v-else class="space-y-2 text-xs">
        <div class="hidden md:grid grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] px-3 py-2 text-[11px] text-slate-400">
          <span>Title</span>
          <span>Category</span>
          <span>Priority</span>
          <span>Due date</span>
        </div>

        <div
          v-for="task in pagedTasks"
          :key="task.id"
          class="grid grid-cols-1 md:grid-cols-[minmax(0,2.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] gap-1 items-center px-3 py-3 rounded-2xl bg-white border border-slate-100 hover:bg-amber-50/40 cursor-pointer"
          @click="$router.push({ name: 'task-detail', params: { id: task.id } })"
        >
          <div class="flex flex-col">
            <span class="text-[13px] font-medium text-slate-900">{{ task.title }}</span>
            <span class="text-[11px] text-slate-400 line-clamp-1">{{ task.description }}</span>
          </div>

          <div class="flex items-center gap-2 mt-1 md:mt-0">
            <template v-if="categoryFor(task)">
              <span
                class="w-2.5 h-2.5 rounded-full"
                :style="{ backgroundColor: categoryFor(task).color }"
              />
              <span class="text-[11px] text-slate-600">{{ categoryFor(task).name }}</span>
            </template>
            <span v-else class="text-[11px] text-slate-400">No category</span>
          </div>

          <div class="mt-1 md:mt-0">
            <span
              v-if="task.priority"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
              :class="task.priority === 'high'
                ? 'bg-red-50 text-red-700 border border-red-100'
                : task.priority === 'medium'
                  ? 'bg-amber-50 text-amber-800 border border-amber-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'"
            >
              {{ task.priority }}
            </span>
          </div>

          <div class="mt-1 md:mt-0 text-[11px] text-slate-500">
            <span v-if="task.due_date">{{ task.due_date }}</span>
            <span v-else class="text-slate-400">No date</span>
          </div>
        </div>

        <div class="flex items-center justify-between mt-3 text-[11px] text-slate-500">
          <p>
            Showing
            {{ pagedTasks.length }} of {{ filteredTasks.length }} tasks
          </p>
          <div class="flex items-center gap-2">
            <button
              class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 disabled:opacity-50"
              :disabled="page === 1"
              @click="goPage('prev')"
            >
              Prev
            </button>
            <span>Page {{ page }} / {{ totalPages }}</span>
            <button
              class="px-2 py-1 rounded-full border border-slate-200 bg-slate-50 disabled:opacity-50"
              :disabled="page === totalPages"
              @click="goPage('next')"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
