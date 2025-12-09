import { defineStore } from 'pinia'

import { fetchCategories } from './supabaseClient'

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async loadCategories() {
      if (this.items.length > 0) return

      this.loading = true
      this.error = null
      try {
        const data = await fetchCategories()
        this.items = data
      } catch (err) {
        this.error = err.message || 'Failed to load categories'
      } finally {
        this.loading = false
      }
    },
    getById(id) {
      return this.items.find((c) => c.id === id)
    },
  },
})
