const PROJECT_ID = 'kbybdtacoqvgcijrkzkv'

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtieWJkdGFjb3F2Z2NpanJremt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMzUwNjAsImV4cCI6MjA3MTYxMTA2MH0.SAF_9jupuaVLHq0l7Zbew7t6avUdg_UkdVGqLZmHTQE'

const BASE_URL = `https://${PROJECT_ID}.supabase.co/rest/v1`

function getHeaders() {
  return {
    Authorization: `Bearer ${ANON_KEY}`,
    apikey: ANON_KEY,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  }
}

async function getJson(url) {
  const res = await fetch(url, {
    headers: getHeaders(),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(error?.message || `Request failed with ${res.status}`)
  }

  return res.json()
}

async function sendJson(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => null)
    throw new Error(error?.message || `Request failed with ${res.status}`)
  }

  return res.json()
}

export function fetchCategories() {
  const url = `${BASE_URL}/categories?order=name.asc`
  return getJson(url)
}

export function fetchTasks(params = {}) {
  const searchParams = new URLSearchParams()
  searchParams.set('order', 'created_at.desc')

  if (params.limit) searchParams.set('limit', params.limit)
  if (params.offset) searchParams.set('offset', params.offset)
  if (params.categoryId) searchParams.set('category_id', `eq.${params.categoryId}`)
  if (params.completed !== undefined) searchParams.set('completed', `eq.${params.completed}`)
  if (params.priority) searchParams.set('priority', `eq.${params.priority}`)

  const url = `${BASE_URL}/tasks?${searchParams.toString()}`
  return getJson(url)
}

export function fetchTask(id) {
  const url = `${BASE_URL}/tasks?id=eq.${id}`
  return getJson(url)
}

export function createTask(payload) {
  const url = `${BASE_URL}/tasks`
  return sendJson(url, 'POST', payload)
}

export function updateTask(id, payload) {
  const url = `${BASE_URL}/tasks?id=eq.${id}`
  return sendJson(url, 'PATCH', payload)
}

export function deleteTask(id) {
  const url = `${BASE_URL}/tasks?id=eq.${id}`
  return fetch(url, {
    method: 'DELETE',
    headers: getHeaders(),
  })
}
