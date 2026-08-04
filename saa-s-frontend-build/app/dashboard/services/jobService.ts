"use client"

import { api } from "./api"

export type JobStatus = "draft" | "published" | "closed" | "archived"

export type JobPost = {
  id: number | string
  title: string
  slug: string
  location: string
  category: string
  job_type?: string | null
  application_form_key?: string | null
  application_form_name?: string | null
  image?: string | null
  image_url?: string | null
  bullets: string[]
  note?: string | null
  application_email?: string | null
  application_url?: string | null
  status: JobStatus
  published_at?: string | null
  created_at?: string
  updated_at?: string
}

export type JobFilters = {
  page?: number
  per_page?: number
  search?: string
  status?: JobStatus | ""
  category?: string
  sort?: "latest" | "oldest" | "title" | "published"
}

export type PaginatedJobs = {
  success: boolean
  data: JobPost[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function getPublicJobs(filters: JobFilters = {}) {
  const response = await api.get<PaginatedJobs>("/job-posts", { params: filters })
  return response.data
}

export async function getPublicJob(slug: string) {
  const response = await api.get<{ success: boolean; data: JobPost }>(`/job-posts/${slug}`)
  return response.data.data
}

export async function getAdminJobs(filters: JobFilters = {}) {
  const response = await api.get<PaginatedJobs>("/admin/job-posts", { params: filters })
  return response.data
}

export async function getAdminJob(id: number | string) {
  const response = await api.get<{ success: boolean; data: JobPost }>(`/admin/job-posts/${id}`)
  return response.data.data
}

export async function createJob(payload: FormData) {
  const response = await api.post<{ success: boolean; data: JobPost }>("/admin/job-posts", payload)
  return response.data.data
}

export async function updateJob(id: number | string, payload: FormData) {
  payload.append("_method", "PUT")
  const response = await api.post<{ success: boolean; data: JobPost }>(`/admin/job-posts/${id}`, payload)
  return response.data.data
}

export async function updateJobStatus(id: number | string, status: JobStatus) {
  const response = await api.patch<{ success: boolean; data: JobPost }>(`/admin/job-posts/${id}/status`, { status })
  return response.data.data
}

export async function deleteJob(id: number | string) {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/job-posts/${id}`)
  return response.data
}
