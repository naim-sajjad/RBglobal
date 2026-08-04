"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "../../services/api"
import {
  deleteContactSubmission,
  updateContactSubmissionStatus,
  type ContactSubmission,
} from "../../services/contactService"
import {
  deleteNewsletterSubscriber,
  updateNewsletterSubscriberStatus,
  type NewsletterSubscriber,
} from "../../services/newsletterService"
import {
  getFormSubmissionDetail,
  type CombinedSubmission,
  type FormSubmissionField,
} from "../../services/formsService"
import DeleteConfirmation from "../../website/DeleteConfirmation"

const labels: Record<string, string> = {
  first_name: "First name",
  last_name: "Last name",
  name: "Name",
  email: "Email",
  secondary_email: "Secondary email",
  phone: "Phone",
  secondary_phone: "Secondary phone",
  location: "City / location",
  city: "City",
  role: "User type",
  subscriber_type: "Subscriber type",
  consent: "Newsletter consent",
  consent_at: "Consent date",
  subject: "Subject",
  message: "Message",
  source: "Source",
  language: "Language",
  status: "Status",
  read_at: "Seen at",
  original_created_at: "Original submitted date",
  original_submitted_at: "Original submitted date",
  subscribed_at: "Subscribed date",
  unsubscribed_at: "Unsubscribed date",
  email_subscriber_status: "Email subscriber status",
  sms_subscriber_status: "SMS subscriber status",
  last_activity: "Last activity",
  last_activity_at: "Last activity date",
  imported_at: "Imported date",
  import_batch_id: "Import batch",
  import_source_file: "Import file",
  current_status: "Current status",
  course: "Course",
  job_id: "Job ID",
  job_title: "Job title",
  job_slug: "Job slug",
  job_type: "Job type",
  application_form_key: "Application form key",
  application_form_name: "Application form",
  availability: "Availability",
  immigration_status: "Immigration status",
  license_type: "Licence type",
  az_license_age: "Licence age",
  experience: "Experience",
  referred_by: "Referred by",
  resume_original_name: "Resume",
  form_key: "Form key",
  form_name: "Form name",
  created_at: "Created date",
  updated_at: "Last updated",
}

const hiddenFields = new Set(["id", "unsubscribe_token", "resume_path", "ip_address", "user_agent", "imported_by"])

function normalizeValue(key: string, value: string | number | boolean | null) {
  if (key === "subscriber_type" || key === "role") {
    if (value === "job_seeker" || value === "seeker") return "Job Seeker"
    if (value === "employer") return "Employer"
  }
  return value
}

function fieldsFromRecord(record: Record<string, string | number | boolean | null>): FormSubmissionField[] {
  return Object.entries(record)
    .filter(([key, value]) => !hiddenFields.has(key) && value !== null && value !== "")
    .map(([key, value]) => ({
      key,
      label: labels[key] || key.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase()),
      value: normalizeValue(key, value),
      type: key === "message" ? "multiline" as const : typeof value === "boolean" ? "boolean" as const : undefined,
    }))
}

function Field({ field }: { field: FormSubmissionField }) {
  const content = typeof field.value === "boolean" ? (field.value ? "Yes" : "No") : String(field.value)
  return <div className={field.type === "multiline" ? "sm:col-span-2" : ""}>
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt>
    <dd className={`mt-1 break-words text-sm text-slate-100 ${field.type === "multiline" ? "whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900/50 p-3 leading-6" : ""}`}>{content}</dd>
  </div>
}

export function SubmissionDetailsDrawer({ item, open, onOpenChange, onChanged, onDeleted }: {
  item: CombinedSubmission | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onChanged: () => Promise<void> | void
  onDeleted: () => Promise<void> | void
}) {
  const [record, setRecord] = useState<Record<string, string | number | boolean | null> | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState("")

  const reloadDetail = async (submission: CombinedSubmission) => {
    const detail = await getFormSubmissionDetail(submission.record_type, submission.record_id)
    setRecord(detail.record)
  }

  useEffect(() => {
    if (!open || !item) return
    let active = true
    setRecord(null)
    setLoading(true)
    setError("")

    void (async () => {
      try {
        if (item.record_type === "contact" && item.status === "unread") {
          await updateContactSubmissionStatus(item.record_id, "read")
          await onChanged()
        }
        const detail = await getFormSubmissionDetail(item.record_type, item.record_id)
        if (active) setRecord(detail.record)
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError))
      } finally {
        if (active) setLoading(false)
      }
    })()

    return () => { active = false }
  }, [item?.id, open])

  const fields = useMemo(() => record ? fieldsFromRecord(record) : [], [record])
  const recordStatus = String(record?.status || item?.status || "")
  const submittedAt = String(record?.original_created_at || record?.original_submitted_at || record?.subscribed_at || record?.created_at || item?.submitted_at || "")
  const email = String(record?.email || item?.email || "")

  const download = async () => {
    if (!item) return
    setDownloading(true)
    try {
      const { jsPDF } = await import("jspdf")
      const document = new jsPDF()
      const margin = 18
      const pageWidth = document.internal.pageSize.getWidth()
      const pageHeight = document.internal.pageSize.getHeight()
      const contentWidth = pageWidth - margin * 2
      let y = 20

      document.setTextColor(11, 112, 183); document.setFontSize(11)
      document.text("R&B Services Plus Inc.", margin, y); y += 9
      document.setTextColor(23, 32, 51); document.setFontSize(20)
      document.text(item.form_name, margin, y); y += 9
      document.setFontSize(10); document.setTextColor(82, 96, 120)
      document.text(`Submission #${item.record_id}  |  ${submittedAt ? new Date(submittedAt).toLocaleString() : "Date unavailable"}  |  ${recordStatus}`, margin, y); y += 12

      for (const field of fields) {
        const rawValue = typeof field.value === "boolean" ? (field.value ? "Yes" : "No") : String(field.value)
        const lines = document.splitTextToSize(rawValue, contentWidth - 45)
        const blockHeight = Math.max(8, lines.length * 5 + 3)
        if (y + blockHeight > pageHeight - 15) { document.addPage(); y = 18 }
        document.setFont("helvetica", "bold"); document.setTextColor(82, 96, 120); document.text(field.label, margin, y)
        document.setFont("helvetica", "normal"); document.setTextColor(23, 32, 51); document.text(lines, margin + 45, y)
        y += blockHeight
      }
      document.save(`${item.record_type}-submission-${item.record_id}.pdf`)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setDownloading(false)
    }
  }

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full max-w-none overflow-y-auto border-slate-700 bg-slate-800 p-0 text-white sm:max-w-2xl">
      <SheetHeader className="sticky top-0 z-10 border-b border-slate-700 bg-slate-800 px-5 py-5 pr-14 text-left sm:px-7">
        <SheetTitle className="text-xl text-white">Submission details</SheetTitle>
        <SheetDescription className="text-slate-400">{item?.form_name}</SheetDescription>
      </SheetHeader>
      <div className="space-y-6 p-5 sm:p-7">
        {item && <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-4">
          <div className="font-medium text-white">{email || "No email provided"}</div>
          <div className="mt-1 text-sm text-slate-400">{submittedAt ? new Date(submittedAt).toLocaleString() : "Submission date unavailable"}</div>
          <div className="mt-3 text-sm capitalize text-slate-300">Status: <span className="font-semibold text-white">{recordStatus === "unread" ? "New" : recordStatus === "read" ? "Seen" : recordStatus}</span></div>
        </div>}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-slate-600 bg-transparent text-slate-100" disabled={!record || downloading} onClick={() => void download()}>
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download PDF
          </Button>
          {item?.record_type === "contact" && record && <select value={recordStatus} onChange={async (event) => { await updateContactSubmissionStatus(item.record_id, event.target.value as ContactSubmission["status"]); await reloadDetail(item); await onChanged() }} className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm">
            <option value="unread">New</option><option value="read">Seen</option><option value="archived">Archived</option>
          </select>}
          {item?.record_type === "newsletter" && record && <select value={recordStatus} onChange={async (event) => { await updateNewsletterSubscriberStatus(item.record_id, event.target.value as NewsletterSubscriber["status"]); await reloadDetail(item); await onChanged() }} className="rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm">
            <option value="active">Active</option><option value="unsubscribed">Unsubscribed</option><option value="blocked">Blocked</option>
          </select>}
          {item && ["contact", "newsletter"].includes(item.record_type) && record && <DeleteConfirmation itemName="submission" description={`Delete the submission for ${email || "this person"}? This cannot be undone.`} onDelete={async () => {
            if (item.record_type === "contact") await deleteContactSubmission(item.record_id)
            if (item.record_type === "newsletter") await deleteNewsletterSubscriber(item.record_id)
            onOpenChange(false); await onDeleted()
          }} />}
        </div>

        {error && <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">{error}</div>}
        {loading ? <div className="grid gap-5 sm:grid-cols-2">{Array.from({ length: 10 }).map((_, index) => <div className="space-y-2" key={index}><Skeleton className="h-3 w-24 bg-slate-700" /><Skeleton className="h-7 bg-slate-700" /></div>)}</div> :
          <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">{fields.map((field) => <Field field={field} key={field.key} />)}</dl>}
      </div>
    </SheetContent>
  </Sheet>
}
