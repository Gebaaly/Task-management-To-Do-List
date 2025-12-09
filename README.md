# Vue 3 + Vite
# Tasky

Simple task manager dashboard built with **Vue 3**, **Vite**, **Pinia**, **Vue Router**, **Tailwind CSS** and **Supabase**.

The goal of this project is to practice a clean UI/UX for managing tasks while keeping the code style easy and beginner‑friendly.

## Features

- **Dashboard view**
  - Split columns for **Active** and **Completed** tasks.
  - Filters by **category** and **priority**.
  - Search box for task title / description.
  - Pagination (20 tasks per page) for each column.
  - Task details in a **modal** with edit / delete and status toggle (Active / Done).
  - **Add task** from a popup form (no separate page).

- **My Tasks view**
  - Table‑style list of all tasks.
  - Search, pagination and quick navigation to task detail.

- **Supabase backend**
  - Tasks and categories are loaded and saved using Supabase REST API.
  - State is managed in simple **Pinia** stores.

## Tech stack

- [Vue 3](https://vuejs.org/) + [Vite](https://vitejs.dev/)
- [Pinia](https://pinia.vuejs.org/) for state management
- [Vue Router](https://router.vuejs.org/) for pages
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Supabase](https://supabase.com/) as backend (REST API)

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

Check `src/stores/supabaseClient.js` and make sure the **URL** and **ANON KEY** match your Supabase project.

It is recommended to use environment variables (for example `.env`) instead of hard‑coding keys when you deploy.

### 3. Run the dev server

```bash
npm run dev
```

Then open the URL shown in the terminal (usually `http://localhost:5173/`).

## Project structure (main parts)

- `src/views/TaskListView.vue` – main dashboard UI (Tasky)
- `src/views/MyTasksView.vue` – table view for all tasks
- `src/components/TaskCard.vue` – small card for a single task
- `src/stores/tasksStore.js` – Pinia store for tasks
- `src/stores/categoriesStore.js` – Pinia store for categories

## Notes

- Code is intentionally kept **simple** so it is easy to read and modify.
- You can change the design (colors, spacing, fonts) directly in the Vue templates and Tailwind classes.


This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
