// id of the Supabase project, used to build the base URL
const PROJECT_ID = 'kbybdtacoqvgcijrkzkv'

// public anonymous key for the Supabase project
// in a real app this should be in an env variable
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieWJkdGFjb3F2Z2NpanJremt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzUwNjAsImV4cCI6MjA3MTYxMTA2MH0.SAF_9jupuaVLHq0l7Zbew7t6avUdg_UkdVGqLZmHTQE'

// base URL for all REST calls to Supabase
const BASE_URL = `https://${PROJECT_ID}.supabase.co/rest/v1`

// helper function to build the headers we send with every request
function getHeaders() {
  return {
    // Supabase needs the Bearer token to authorize the request
    Authorization: `Bearer ${ANON_KEY}`,
    // apikey header is also required by Supabase
    apikey: ANON_KEY,
    // we send and receive JSON
    'Content-Type': 'application/json',
    // ask Supabase to return the created/updated row as JSON
    Prefer: 'return=representation',
  }
}

// helper to send a GET request and parse JSON
async function getJson(url) {
  // call fetch with the common headers
  const res = await fetch(url, {
    headers: getHeaders(),
  })

  // if status code is not OK, read the error body and throw
  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(error?.message || `Request failed with ${res.status}`)
  }

  // when everything is fine, return the parsed JSON
  return res.json()
}

// helper to send POST/PATCH with a JSON body and parse JSON
async function sendJson(url, method, body) {
  // send the request with method and JSON body
  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  // same error handling as in getJson
  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(error?.message || `Request failed with ${res.status}`)
  }

  // return response JSON (usually an array of rows)
  return res.json()
}

// get all categories ordered by name
export function fetchCategories() {
  const url = `${BASE_URL}/categories?order=name.asc`
  return getJson(url)
}

// get a list of tasks with optional filter params
export function fetchTasks(params = {}) {
  // URLSearchParams helps build the query string
  const searchParams = new URLSearchParams()
  // always order by created_at descending
  searchParams.set('order', 'created_at.desc')

  // add pagination and filter params only if they are provided
  if (params.limit) searchParams.set('limit', params.limit)
  if (params.offset) searchParams.set('offset', params.offset)
  if (params.categoryId) searchParams.set('category_id', `eq.${params.categoryId}`)
  if (params.completed !== undefined) searchParams.set('completed', `eq.${params.completed}`)
  if (params.priority) searchParams.set('priority', `eq.${params.priority}`)

  const url = `${BASE_URL}/tasks?${searchParams.toString()}`
  return getJson(url)
}

// get a single task by id
export function fetchTask(id) {
  const url = `${BASE_URL}/tasks?id=eq.${id}`
  return getJson(url)
}

// create a new task
export function createTask(payload) {
  const url = `${BASE_URL}/tasks`
  return sendJson(url, 'POST', payload)
}

// update an existing task by id
export function updateTask(id, payload) {
  const url = `${BASE_URL}/tasks?id=eq.${id}`
  return sendJson(url, 'PATCH', payload)
}

// delete a task by id
export function deleteTask(id) {
  const url = `${BASE_URL}/tasks?id=eq.${id}`
  return fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
  })
}
