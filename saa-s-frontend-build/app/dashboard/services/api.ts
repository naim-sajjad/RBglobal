"use client"

import axios, { AxiosError } from "axios"

export type AdminUser = {
  id: number | string
  name: string
  email: string
  role: "super_admin" | "admin" | "editor"
  status: "active" | "inactive"
  must_change_password: boolean
  last_login_at?: string | null
  created_at?: string
  updated_at?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
  meta?: {
    current_page?: number
    last_page?: number
    per_page?: number
    total?: number
  }
}

export type ContactEntry = {
  id: number | string
  name: string
  email: string
  phone?: string | null
  subject: string
  message?: string | null
  created_at: string
  status?: "read" | "unread" | string
}

export type NewsletterSubscriber = {
  id: number | string
  email: string
  created_at: string
}

export type BlogCategory = {
  id: number | string
  name: string
  slug: string
  description?: string | null
  created_at?: string
}

export type BlogPost = {
  id: number | string
  title: string
  slug: string
  featured_image?: string | null
  category_id?: number | string | null
  category?: BlogCategory | null
  short_description?: string | null
  content?: string | null
  seo_title?: string | null
  meta_description?: string | null
  status: "published" | "draft" | string
  created_at?: string
  updated_at?: string
}

export type DashboardStats = {
  total_contacts: number
  unread_contacts: number
  total_active_subscribers: number
  total_subscribers: number
  total_blog_posts: number
  total_blogs: number
  published_posts: number
  draft_posts: number
  total_jobs?: number
  published_jobs?: number
  draft_jobs?: number
  total_admin_users?: number | null
  recent_entries: ContactEntry[]
}

export type ListParams = {
  page?: number
  search?: string
  status?: string
}

const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api"
const normalizedApiUrl = configuredApiUrl.replace(/\/$/, "").replace(/\/api\/v1$/, "/api")
const apiBaseUrl = normalizedApiUrl.endsWith("/api") ? normalizedApiUrl : `${normalizedApiUrl}/api`

export const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: false,
  headers: {
    Accept: "application/json",
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    // Website management is part of the main dashboard, so use its Sanctum token.
    const token = localStorage.getItem("auth_token") ?? localStorage.getItem("admin_token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
      window.location.href = "/login"
    }
    if (error.response?.status === 403 && typeof window !== "undefined") {
      // Keep the user signed in, but let pages show the permission error.
    }

    return Promise.reject(error)
  },
)

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined
    const firstValidationError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return firstValidationError ?? data?.message ?? error.message
  }

  return "Something went wrong. Please try again."
}

export const authApi = {
  async login(payload: { email: string; password: string; remember: boolean }) {
    const response = await api.post<{ token: string; user: AdminUser }>("/admin/login", payload)
    return response.data
  },
  async me() {
    const response = await api.get<{ user: AdminUser }>("/admin/me")
    return response.data.user
  },
  async logout() {
    await api.post("/admin/logout")
  },
  async changePassword(payload: { current_password: string; password: string; password_confirmation: string }) {
    const response = await api.post<{ success: boolean; message: string; user: AdminUser }>("/admin/change-password", payload)
    return response.data
  },
}

export const dashboardApi = {
  async stats() {
    const response = await api.get<DashboardStats>("/admin/dashboard/stats")
    return response.data
  },
}

export const contactsApi = {
  async list(params: ListParams) {
    const response = await api.get<PaginatedResponse<ContactEntry>>("/admin/contacts", { params })
    return response.data
  },
  async get(id: number | string) {
    const response = await api.get<{ data: ContactEntry } | ContactEntry>(`/admin/contacts/${id}`)
    return "data" in response.data ? response.data.data : response.data
  },
  async markAsRead(id: number | string) {
    await api.patch(`/admin/contacts/${id}/read`)
  },
  async remove(id: number | string) {
    await api.delete(`/admin/contacts/${id}`)
  },
}

export const newsletterApi = {
  async list(params: ListParams) {
    const response = await api.get<PaginatedResponse<NewsletterSubscriber>>("/admin/newsletter", { params })
    return response.data
  },
  async remove(id: number | string) {
    await api.delete(`/admin/newsletter/${id}`)
  },
}

export const blogsApi = {
  async list(params: ListParams) {
    const response = await api.get<PaginatedResponse<BlogPost>>("/admin/blogs", { params })
    return response.data
  },
  async get(id: number | string) {
    const response = await api.get<{ data: BlogPost } | BlogPost>(`/admin/blogs/${id}`)
    return "data" in response.data ? response.data.data : response.data
  },
  async create(payload: FormData) {
    const response = await api.post<BlogPost>("/admin/blogs", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },
  async update(id: number | string, payload: FormData) {
    payload.append("_method", "PUT")
    const response = await api.post<BlogPost>(`/admin/blogs/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },
  async remove(id: number | string) {
    await api.delete(`/admin/blogs/${id}`)
  },
  async setStatus(id: number | string, status: "published" | "draft") {
    await api.patch(`/admin/blogs/${id}/status`, { status })
  },
}

export const categoriesApi = {
  async list(params: ListParams = {}) {
    const response = await api.get<PaginatedResponse<BlogCategory>>("/admin/categories", { params })
    return response.data
  },
  async create(payload: Pick<BlogCategory, "name" | "slug" | "description">) {
    const response = await api.post<BlogCategory>("/admin/categories", payload)
    return response.data
  },
  async update(id: number | string, payload: Pick<BlogCategory, "name" | "slug" | "description">) {
    const response = await api.put<BlogCategory>(`/admin/categories/${id}`, payload)
    return response.data
  },
  async remove(id: number | string) {
    await api.delete(`/admin/categories/${id}`)
  },
}
