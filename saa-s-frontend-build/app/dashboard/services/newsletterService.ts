"use client"

import { api } from "./api"

export type NewsletterSubscriberStatus = "active" | "unsubscribed" | "blocked"
export type NewsletterRole = "seeker" | "employer"

export type NewsletterSubscriptionPayload = {
  email: string
  name?: string
  role?: NewsletterRole
  source?: string
}

export type NewsletterSubscriptionResponse = {
  success: boolean
  message: string
}

export type NewsletterSubscriber = {
  id: number | string
  email: string
  name?: string | null
  role?: NewsletterRole | null
  subscriber_type?: string | null
  consent?: boolean
  consent_at?: string | null
  status: NewsletterSubscriberStatus
  source?: string | null
  original_submitted_at?: string | null
  subscribed_at?: string | null
  unsubscribed_at?: string | null
  import_batch_id?: number | string | null
  imported_at?: string | null
  imported_by?: number | string | null
  import_source_file?: string | null
  created_at: string
  updated_at: string
}

export type NewsletterSubscriberFilters = {
  page?: number
  per_page?: number
  search?: string
  status?: NewsletterSubscriberStatus | ""
  subscriber_type?: string
  consent?: boolean
  source?: string
  date_from?: string
  date_to?: string
  imported_only?: boolean
  import_batch_id?: number | string
  sort?: "latest"
}

export type NewsletterImportMode = "skip_duplicates" | "update_empty_fields" | "reactivate_consented"

export type NewsletterImportBatch = {
  id: number | string
  type: "newsletter_subscribers"
  original_filename: string
  stored_filename?: string | null
  status: "pending" | "processing" | "completed" | "completed_with_errors" | "failed"
  total_rows: number
  imported_rows: number
  skipped_rows: number
  failed_rows: number
  duplicate_rows: number
  active_rows?: number
  non_consented_rows?: number
  error_file_path?: string | null
  imported_by?: number | string | null
  importer?: { id: number | string; name: string; email: string } | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export type NewsletterImportResult = {
  batch_id: number | string
  total_rows: number
  imported_rows: number
  duplicate_rows: number
  skipped_rows: number
  failed_rows: number
  active_rows: number
  non_consented_rows: number
  error_file_url?: string | null
}

export type NewsletterImportPreview = {
  headers_valid: boolean
  expected_headers: string[]
  detected_headers: string[]
  sample_rows: Array<{
    row: number
    values: Record<string, string | boolean | null>
    duplicate: boolean
    errors: string[]
  }>
  active_rows: number
  non_consented_rows: number
}

export type PaginatedNewsletterImports = {
  success: boolean
  data: NewsletterImportBatch[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type PaginatedNewsletterSubscribers = {
  success: boolean
  data: NewsletterSubscriber[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type ApiErrorResponse = {
  message?: string
  errors?: Record<string, string[]>
}

export async function subscribeToNewsletter(payload: NewsletterSubscriptionPayload) {
  const response = await api.post<NewsletterSubscriptionResponse>("/newsletter-subscriptions", payload)
  return response.data
}

export async function getNewsletterSubscribers(filters: NewsletterSubscriberFilters) {
  const response = await api.get<PaginatedNewsletterSubscribers>("/admin/newsletter-subscribers", {
    params: filters,
  })
  return response.data
}

export async function getNewsletterSubscriber(id: number | string) {
  const response = await api.get<{ success: boolean; data: NewsletterSubscriber }>(
    `/admin/newsletter-subscribers/${id}`,
  )
  return response.data.data
}

export async function updateNewsletterSubscriberStatus(
  id: number | string,
  status: NewsletterSubscriberStatus,
) {
  const response = await api.patch<{ success: boolean; data: NewsletterSubscriber }>(
    `/admin/newsletter-subscribers/${id}/status`,
    { status },
  )
  return response.data.data
}

export async function deleteNewsletterSubscriber(id: number | string) {
  const response = await api.delete<{ success: boolean; message: string }>(
    `/admin/newsletter-subscribers/${id}`,
  )
  return response.data
}

export async function exportNewsletterSubscribers(filters: NewsletterSubscriberFilters) {
  const response = await api.get<Blob>("/admin/newsletter-subscribers/export", {
    params: filters,
    responseType: "blob",
  })
  return response.data
}

export async function previewNewsletterImport(file: File) {
  const payload = new FormData()
  payload.append("file", file)
  const response = await api.post<{ success: boolean; data: NewsletterImportPreview }>(
    "/admin/newsletter-subscribers/import/preview",
    payload,
  )
  return response.data.data
}

export async function importNewsletterSubscribers(file: File, mode: NewsletterImportMode = "skip_duplicates") {
  const payload = new FormData()
  payload.append("file", file)
  payload.append("mode", mode)
  const response = await api.post<{ success: boolean; message: string; data: NewsletterImportResult }>(
    "/admin/newsletter-subscribers/import",
    payload,
  )
  return response.data
}

export async function getNewsletterImportHistory(filters: { page?: number; per_page?: number } = {}) {
  const response = await api.get<PaginatedNewsletterImports>("/admin/newsletter-imports", { params: filters })
  return response.data
}

export async function getNewsletterImportDetails(id: number | string) {
  const response = await api.get<{ success: boolean; data: NewsletterImportBatch }>(`/admin/newsletter-imports/${id}`)
  return response.data.data
}

export async function downloadNewsletterImportErrors(id: number | string) {
  const response = await api.get<Blob>(`/admin/newsletter-imports/${id}/errors`, { responseType: "blob" })
  return response.data
}

export async function downloadNewsletterImportTemplate() {
  const response = await api.get<Blob>("/admin/newsletter-subscribers/import-template", {
    responseType: "blob",
  })
  return response.data
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
