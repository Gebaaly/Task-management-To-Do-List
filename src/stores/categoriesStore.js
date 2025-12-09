// import defineStore helper from Pinia so we can create a store
import { defineStore } from 'pinia'

// import the API function that fetches categories from Supabase
import { fetchCategories } from './supabaseClient'

// create and export a Pinia store for categories
export const useCategoriesStore = defineStore('categories', {
  // state is a function that returns the initial state object
  state: () => ({
    // list of category objects that we get from the backend
    items: [],
    // flag to show when we are loading categories
    loading: false,
    // holds an error message if something goes wrong
    error: null,
  }),
  // actions are functions that can change the state and do async work
  actions: {
    // load all categories from the API
    async loadCategories() {
      // if we already have categories, do not load them again
      if (this.items.length > 0) return

      // mark as loading so the UI can show a spinner or skeleton
      this.loading = true
      // clear any old error before starting a new request
      this.error = null
      try {
        // call Supabase REST API to get categories
        const data = await fetchCategories()
        // save the categories into the state
        this.items = data
      } catch (err) {
        // if something failed, keep a readable error message in state
        this.error = err.message || 'Failed to load categories'
      } finally {
        // always set loading to false when the request finishes
        this.loading = false
      }
    },
    // helper function to get a single category by its id
    getById(id) {
      // find the first category with the matching id
      return this.items.find((c) => c.id === id)
    },
  },
})
