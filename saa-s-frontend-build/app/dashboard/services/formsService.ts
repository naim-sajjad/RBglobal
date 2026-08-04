"use client"

import { api } from "./api"

export type FormKey =
  | "all"
  | "career_growth_course_application"
  | "job_seeker_contact"
  | "employer_contact"
  | "subscribe"
  | "general_labour_application"
  | "az_driver_application"
  | "forklift_application"
  | "unclassified_contact"
  | "unclassified_job_application"

export type FormSummary = {
  key: Exclude<FormKey, "all">
  name: string
  type: string
  submissions_count: number
  new_submissions_count: number
  status: "active"
  last_updated_at?: string | null
  created_at?: string | null
}

export type CombinedSubmission = {
  id: string
  record_id: number
  record_type: "contact" | "newsletter" | "career_growth" | "job_application"
  form_key: Exclude<FormKey, "all">
  form_name: string
  name?: string | null
  email: string
  phone?: string | null
  location?: string | null
  subject?: string | null
  message_preview?: string | null
  subscriber_type?: string | null
  consent?: boolean | number | null
  job_title?: string | null
  job_slug?: string | null
  job_id?: number | null
  availability?: string | null
  current_status?: string | null
  course?: string | null
  status: string
  source?: string | null
  submitted_at: string
  deleted_at?: string | null
  deleted_by?: number | null
}

export type FormSubmissionField = {
  key: string
  label: string
  value: string | number | boolean | null | undefined
  type?: "text" | "email" | "phone" | "date" | "multiline" | "boolean"
}

export type FormSubmissionDetail = {
  record_type: CombinedSubmission["record_type"]
  record: Record<string, string | number | boolean | null>
}

export type FormsMeta = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export async function getFormsSummary() {
  const response = await api.get<{ success: boolean; data: FormSummary[] }>("/admin/forms/summary")
  return response.data.data
}

export async function getCombinedSubmissions(filters: {
  form?: FormKey
  search?: string
  status?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  trashed?: "false" | "only"
}) {
  const response = await api.get<{ success: boolean; data: CombinedSubmission[]; meta: FormsMeta }>(
    "/admin/forms/submissions",
    { params: filters },
  )
  return response.data
}

export type SelectedSubmission = {
  form_key: Exclude<FormKey, "all">
  record_id: number
}

export type BulkSubmissionAction = "trash" | "restore" | "force_delete" | "mark_seen" | "archive"

export async function bulkSubmissionAction(action: BulkSubmissionAction, items: SelectedSubmission[]) {
  const response = await api.post("/admin/forms/submissions/bulk-action", { action, items })
  return response.data
}

export async function exportSelectedSubmissions(items: SelectedSubmission[]) {
  const response = await api.post("/admin/forms/submissions/export-selected", { items }, { responseType: "blob" })
  return response.data as Blob
}

export async function exportCurrentSubmissions(filters: {
  form?: FormKey
  search?: string
  status?: string
  date_from?: string
  date_to?: string
  trashed?: "false" | "only"
}) {
  const response = await api.get("/admin/forms/submissions/export", { params: filters, responseType: "blob" })
  return response.data as Blob
}

export async function getFormSubmissionDetail(type: CombinedSubmission["record_type"], id: number) {
  const response = await api.get<{ success: boolean; data: FormSubmissionDetail }>(
    `/admin/forms/submissions/${type}/${id}`,
  )
  return response.data.data
}
