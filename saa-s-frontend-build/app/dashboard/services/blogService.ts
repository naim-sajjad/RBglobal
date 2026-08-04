"use client"

import { api } from "./api"

export type BlogPostStatus = "draft" | "published" | "archived"

export type BlogCategory = {
  id: number | string
  name: string
  slug: string
  description?: string | null
  posts_count?: number
  created_at?: string
  updated_at?: string
}

export type BlogPost = {
  id: number | string
  title: string
  slug: string
  excerpt?: string | null
  content?: string | null
  featured_image?: string | null
  featured_image_url?: string | null
  status: BlogPostStatus
  published_at?: string | null
  seo_title?: string | null
  meta_description?: string | null
  cta_title?: string | null
  cta_description?: string | null
  cta_button_label?: string | null
  cta_button_url?: string | null
  content_format?: "markdown" | string | null
  reading_time?: number | null
  read_time?: string
  category_id?: number | string | null
  category?: BlogCategory | null
  related_posts?: BlogPost[]
  created_at?: string
  updated_at?: string
}

export type BlogPostFilters = {
  page?: number
  per_page?: number
  search?: string
  status?: BlogPostStatus | ""
  category?: string
  sort?: "latest" | "oldest" | "title" | "published"
}

export type PaginatedBlogPosts = {
  success: boolean
  data: BlogPost[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type PaginatedBlogCategories = {
  success: boolean
  data: BlogCategory[]
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function getAdminBlogPosts(filters: BlogPostFilters) {
  const response = await api.get<PaginatedBlogPosts>("/admin/blog-posts", { params: filters })
  return response.data
}

export async function getAdminBlogPost(id: number | string) {
  const response = await api.get<{ success: boolean; data: BlogPost }>(`/admin/blog-posts/${id}`)
  return response.data.data
}

export async function createBlogPost(payload: FormData) {
  const response = await api.post<{ success: boolean; data: BlogPost }>("/admin/blog-posts", payload)
  return response.data.data
}

export async function updateBlogPost(id: number | string, payload: FormData) {
  payload.append("_method", "PUT")
  const response = await api.post<{ success: boolean; data: BlogPost }>(`/admin/blog-posts/${id}`, payload)
  return response.data.data
}

export async function deleteBlogPost(id: number | string) {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/blog-posts/${id}`)
  return response.data
}

export async function updateBlogPostStatus(id: number | string, status: BlogPostStatus) {
  const response = await api.patch<{ success: boolean; data: BlogPost }>(`/admin/blog-posts/${id}/status`, { status })
  return response.data.data
}

export async function getBlogCategories(filters: { page?: number; per_page?: number; search?: string } = {}) {
  const response = await api.get<PaginatedBlogCategories>("/admin/blog-categories", { params: filters })
  return response.data
}

export async function createBlogCategory(payload: Pick<BlogCategory, "name" | "slug" | "description">) {
  const response = await api.post<{ success: boolean; data: BlogCategory }>("/admin/blog-categories", payload)
  return response.data.data
}

export async function updateBlogCategory(id: number | string, payload: Pick<BlogCategory, "name" | "slug" | "description">) {
  const response = await api.put<{ success: boolean; data: BlogCategory }>(`/admin/blog-categories/${id}`, payload)
  return response.data.data
}

export async function deleteBlogCategory(id: number | string) {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/blog-categories/${id}`)
  return response.data
}

export async function getPublicBlogPosts(filters: BlogPostFilters = {}) {
  const response = await api.get<PaginatedBlogPosts>("/blog-posts", { params: filters })
  return response.data
}

export async function getPublicBlogPostBySlug(slug: string) {
  const response = await api.get<{ success: boolean; data: BlogPost }>(`/blog-posts/${slug}`)
  return response.data.data
}
