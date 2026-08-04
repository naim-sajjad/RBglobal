"use client"

import { api } from "./api"

export type ContactSubmissionStatus = "unread" | "read" | "archived"
export type ContactRole = "employer" | "seeker"

export type ContactFormPayload = {
  firstName: string
  lastName: string
  email: string
  phone: string
  location: string
  role: ContactRole
  message: string
}

export type ContactSubmission = {
  id: number | string
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  email?: string | null
  secondary_email?: string | null
  phone?: string | null
  secondary_phone?: string | null
  location?: string | null
  role?: ContactRole | null
  subject?: string | null
  message?: string | null
  status: ContactSubmissionStatus
  read_at?: string | null
  original_created_at?: string | null
  email_subscriber_status?: string | null
  sms_subscriber_status?: string | null
  last_activity?: string | null
  last_activity_at?: string | null
  source?: string | null
  language?: string | null
  import_batch_id?: number | string | null
  imported_at?: string | null
  imported_by?: number | string | null
  import_source_file?: string | null
  created_at: string
  updated_at: string
}

export type ContactSubmissionFilters = {
  page?: number
  per_page?: number
  search?: string
  status?: ContactSubmissionStatus | ""
  source?: string
  date_from?: string
  date_to?: string
  imported_only?: boolean
  import_batch_id?: number | string
  sort?: "latest"
}

export type ContactImportBatch = {
  id: number | string
  type: "contacts"
  original_filename: string
  stored_filename?: string | null
  status: "pending" | "processing" | "completed" | "completed_with_errors" | "failed"
  total_rows: number
  imported_rows: number
  skipped_rows: number
  failed_rows: number
  duplicate_rows: number
  error_file_path?: string | null
  imported_by?: number | string | null
  importer?: { id: number | string; name: string; email: string } | null
  started_at?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export type ContactImportResult = {
  batch_id: number | string
  total_rows: number
  imported_rows: number
  duplicate_rows: number
  skipped_rows: number
  failed_rows: number
  error_file_url?: string | null
}

export type ContactImportPreview = {
  headers_valid: boolean
  expected_headers: string[]
  detected_headers: string[]
  sample_rows: Array<{
    row: number
    values: Record<string, string | null>
    duplicate: boolean
  }>
}

export type PaginatedContactImports = {
  success: boolean
  data: ContactImportBatch[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export type PaginatedContactSubmissions = {
  success: boolean
  data: ContactSubmission[]
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

export async function submitContactForm(payload: ContactFormPayload) {
  const response = await api.post<{ success: boolean; message: string; data: { id: number | string } }>(
    "/contact-submissions",
    payload,
  )
  return response.data
}

export async function getContactSubmissions(filters: ContactSubmissionFilters) {
  const response = await api.get<PaginatedContactSubmissions>("/admin/contact-submissions", {
    params: filters,
  })
  return response.data
}

export async function getContactSubmission(id: number | string) {
  const response = await api.get<{ success: boolean; data: ContactSubmission }>(`/admin/contact-submissions/${id}`)
  return response.data.data
}

export async function updateContactSubmissionStatus(id: number | string, status: ContactSubmissionStatus) {
  const response = await api.patch<{ success: boolean; data: ContactSubmission }>(
    `/admin/contact-submissions/${id}/status`,
    { status },
  )
  return response.data.data
}

export async function deleteContactSubmission(id: number | string) {
  const response = await api.delete<{ success: boolean; message: string }>(`/admin/contact-submissions/${id}`)
  return response.data
}

export async function importContacts(file: File, skipDuplicates = true) {
  const payload = new FormData()
  payload.append("file", file)
  payload.append("skip_duplicates", skipDuplicates ? "1" : "0")
  const response = await api.post<{ success: boolean; message: string; data: ContactImportResult }>(
    "/admin/contact-submissions/import",
    payload,
  )
  return response.data
}

export async function previewContactImport(file: File) {
  const payload = new FormData()
  payload.append("file", file)
  const response = await api.post<{ success: boolean; data: ContactImportPreview }>(
    "/admin/contact-submissions/import/preview",
    payload,
  )
  return response.data.data
}

export async function getContactImportHistory(filters: { page?: number; per_page?: number } = {}) {
  const response = await api.get<PaginatedContactImports>("/admin/contact-imports", { params: filters })
  return response.data
}

export async function getContactImportDetails(id: number | string) {
  const response = await api.get<{ success: boolean; data: ContactImportBatch }>(`/admin/contact-imports/${id}`)
  return response.data.data
}

export async function downloadContactImportErrors(id: number | string) {
  const response = await api.get<Blob>(`/admin/contact-imports/${id}/errors`, { responseType: "blob" })
  return response.data
}

export async function exportContacts(filters: ContactSubmissionFilters) {
  const response = await api.get<Blob>("/admin/contact-submissions/export", {
    params: filters,
    responseType: "blob",
  })
  return response.data
}

export async function downloadContactImportTemplate() {
  const response = await api.get<Blob>("/admin/contact-submissions/import-template", {
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
