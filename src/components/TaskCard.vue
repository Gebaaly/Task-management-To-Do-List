<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true,
  },
  category: {
    type: Object,
    required: false,
    default: null,
  },
})

const emit = defineEmits(['open'])

function openDetail() {
  emit('open', props.task)
}
</script>

<template>
  <article
    class="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex flex-col gap-2 cursor-pointer hover:border-amber-300 hover:shadow-sm transition"
    @click="openDetail"
  >
    <div class="flex items-start justify-between gap-2">
      <h2 class="text-sm font-semibold text-slate-900 line-clamp-2">
        {{ task.title || 'Untitled task' }}
      </h2>
      <span
        class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
        :class="task.completed
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          : 'bg-amber-50 text-amber-800 border border-amber-100'"
      >
        <span v-if="task.completed">Done</span>
        <span v-else>Active</span>
      </span>
    </div>

    <p class="text-[11px] text-slate-500 line-clamp-2 min-h-[32px]">
      {{ task.description || 'No description provided' }}
    </p>

    <div class="flex items-center justify-between text-[11px] text-slate-500 mt-1">
      <div class="flex items-center gap-2" v-if="category">
        <span
          class="w-2.5 h-2.5 rounded-full"
          :style="{ backgroundColor: category.color }"
        />
        <span class="font-medium text-slate-700">{{ category.name }}</span>
      </div>
      <div class="ml-auto flex items-center gap-1">
        <span v-if="task.priority" class="uppercase tracking-wide text-slate-600">
          {{ task.priority }}
        </span>
        <span v-if="task.due_date" class="text-slate-400">
          • {{ task.due_date }}
        </span>
      </div>
    </div>
  </article>
</template>
