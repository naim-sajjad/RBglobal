"use client"

import { ArrowRight, Eye, FileText, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import DeleteConfirmation from "../../website/DeleteConfirmation"
import { Skeleton } from "@/components/ui/skeleton"
import { panel } from "../../website/components"
import type { CombinedSubmission } from "../../services/formsService"

function relativeTime(value: string) {
  const date = new Date(value)
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
  const ranges: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31536000],
    ["month", 2592000],
    ["week", 604800],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ]
  for (const [unit, divisor] of ranges) {
    if (Math.abs(seconds) >= divisor) return formatter.format(Math.round(seconds / divisor), unit)
  }
  return "just now"
}

function statusDetails(item: CombinedSubmission) {
  const status = item.status.toLowerCase()
  if (status === "unread" || status === "new") return { label: "New", classes: "border-blue-700 bg-blue-950/60 text-blue-200", dot: "bg-blue-400" }
  if (status === "read") return { label: "Seen", classes: "border-slate-600 bg-slate-700/50 text-slate-200", dot: "bg-slate-400" }
  if (status === "archived") return { label: "Archived", classes: "border-slate-600 bg-slate-800 text-slate-300", dot: "bg-slate-500" }
  if (status === "active") return { label: "Active", classes: "border-emerald-800 bg-emerald-950/50 text-emerald-300", dot: "bg-emerald-400" }
  if (status === "blocked") return { label: "Blocked", classes: "border-red-800 bg-red-950/40 text-red-300", dot: "bg-red-400" }
  return { label: "Unsubscribed", classes: "border-amber-800 bg-amber-950/40 text-amber-300", dot: "bg-amber-400" }
}

function formDot(key: CombinedSubmission["form_key"]) {
  if (key === "subscribe") return "bg-amber-400"
  if (key === "career_growth_course_application") return "bg-violet-400"
  if (key.includes("application")) return "bg-blue-400"
  return "bg-emerald-400"
}

function summary(item: CombinedSubmission) {
  const subscriberType = item.subscriber_type === "job_seeker" || item.subscriber_type === "seeker"
    ? "Job Seeker"
    : item.subscriber_type === "employer" ? "Employer" : item.subscriber_type
  const values = item.form_key === "subscribe"
    ? [
        ["Type", subscriberType],
        ["Consent", item.consent === null || item.consent === undefined ? null : item.consent ? "Yes" : "No"],
        ["Source", item.source],
      ]
    : item.record_type === "job_application"
      ? [["Job", item.job_title], ["Location", item.location], ["Phone", item.phone], ["Availability", item.availability]]
      : item.record_type === "career_growth"
        ? [["Course", item.course], ["Current status", item.current_status], ["Phone", item.phone]]
        : [
        ["Phone", item.phone],
        ["City", item.location],
        ["Subject", item.subject],
        ["Message", item.message_preview],
      ]
  return values.filter((entry) => entry[1]).slice(0, 3) as string[][]
}

function Summary({ item }: { item: CombinedSubmission }) {
  const fields = summary(item)
  return <div className="space-y-1 text-sm">
    {fields.length ? fields.map(([label, value]) => <div className="max-w-sm truncate" title={value} key={label}><span className="text-slate-500">{label}: </span><span className="text-slate-300">{value}</span></div>) : <span className="text-slate-500">No summary available</span>}
  </div>
}

function Submitter({ item }: { item: CombinedSubmission }) {
  const main = item.name || item.email
  return <div><div className="font-semibold text-white">{main}</div>{item.name && <div className="mt-0.5 text-sm text-slate-400">{item.email}</div>}</div>
}

export function SubmissionsTable({ items, loading, onView, onRetry, selectedIds, onToggle, onToggleAll, trashed, onRestore, onForceDelete }: {
  items: CombinedSubmission[]
  loading: boolean
  onView: (item: CombinedSubmission) => void
  onRetry: () => void
  selectedIds: Set<string>
  onToggle: (item: CombinedSubmission) => void
  onToggleAll: () => void
  trashed: boolean
  onRestore: (item: CombinedSubmission) => Promise<void>
  onForceDelete: (item: CombinedSubmission) => Promise<void>
}) {
  if (loading) return <div className={`${panel} space-y-3 p-5`}>{Array.from({ length: 6 }).map((_, index) => <Skeleton className="h-16 bg-slate-700/70" key={index} />)}</div>
  if (!items.length) return <div className={`${panel} p-12 text-center`}><FileText className="mx-auto mb-3 h-9 w-9 text-slate-500" /><p className="font-medium">No submissions match these filters.</p><p className="mt-1 text-sm text-slate-400">Try changing the form, status, dates, or search.</p><Button variant="outline" className="mt-4 border-slate-600 bg-transparent text-slate-200" onClick={onRetry}>Retry</Button></div>

  const allSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id))
  const someSelected = items.some((item) => selectedIds.has(item.id))
  return <div className={`${panel} max-w-full overflow-hidden`}>
    <div className="hidden max-h-[calc(100vh-25rem)] overflow-auto lg:block">
      <table className="w-full min-w-[980px]">
        <thead className="sticky top-0 z-10 bg-slate-900"><tr>
          <th className="px-5 py-3"><Checkbox aria-label="Select all visible submissions" checked={allSelected ? true : someSelected ? "indeterminate" : false} onCheckedChange={onToggleAll} /></th>
          {["Submitter", "Form", "Summary", trashed ? "Deleted" : "Submitted", trashed ? "Deleted By" : "Status", "Actions"].map((heading) => <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400" key={heading}>{heading}</th>)}
        </tr></thead>
        <tbody className="divide-y divide-slate-700">
          {items.map((item) => {
            const status = statusDetails(item)
            const isNew = item.record_type !== "newsletter" && ["unread", "new"].includes(item.status)
            return <tr className={`${selectedIds.has(item.id) ? "bg-blue-900/30" : isNew ? "bg-blue-950/20 hover:bg-blue-950/30" : "hover:bg-slate-700/20"}`} key={item.id}>
              <td className="px-5 py-4 align-top"><Checkbox aria-label={`Select ${item.name || item.email}`} checked={selectedIds.has(item.id)} onCheckedChange={() => onToggle(item)} /></td>
              <td className="px-5 py-4 align-top"><Submitter item={item} /></td>
              <td className="px-5 py-4 align-top"><span className="inline-flex items-center gap-2 text-sm font-medium text-slate-200"><span className={`h-2.5 w-2.5 rounded-full ${formDot(item.form_key)}`} />{item.form_name}</span></td>
              <td className="px-5 py-4 align-top"><Summary item={item} /></td>
              <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-300">{relativeTime(trashed && item.deleted_at ? item.deleted_at : item.submitted_at)}</td>
              <td className="px-5 py-4 align-top">{trashed ? <span className="text-sm text-slate-300">{item.deleted_by ? `User #${item.deleted_by}` : "System"}</span> : <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${status.classes}`}><span className={`h-2 w-2 rounded-full ${status.dot}`} />{status.label}</span>}</td>
              <td className="px-5 py-4 align-top">{trashed ? <div className="flex items-center gap-3"><Button size="sm" variant="outline" className="border-slate-600 bg-transparent" onClick={() => void onRestore(item)}><RotateCcw className="mr-2 h-4 w-4" />Restore</Button><DeleteConfirmation itemName="submission permanently" onDelete={() => onForceDelete(item)} /></div> : isNew ? <Button size="sm" onClick={() => onView(item)}><Eye className="mr-2 h-4 w-4" />View</Button> : <Button size="icon" variant="ghost" title="View submission" className="text-slate-300 hover:bg-slate-700 hover:text-white" onClick={() => onView(item)}><ArrowRight className="h-4 w-4" /></Button>}</td>
            </tr>
          })}
        </tbody>
      </table>
    </div>

    <div className="divide-y divide-slate-700 lg:hidden">
      {items.map((item) => {
        const status = statusDetails(item)
        const isNew = item.record_type !== "newsletter" && ["unread", "new"].includes(item.status)
        return <article className={`space-y-4 p-4 ${selectedIds.has(item.id) ? "bg-blue-900/30" : isNew ? "bg-blue-950/20" : ""}`} key={item.id}>
          <div className="flex items-start justify-between gap-3"><div className="flex gap-3"><Checkbox checked={selectedIds.has(item.id)} onCheckedChange={() => onToggle(item)} /><Submitter item={item} /></div>{!trashed && <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.classes}`}><span className={`h-2 w-2 rounded-full ${status.dot}`} />{status.label}</span>}</div>
          <div className="flex items-center gap-2 text-sm text-slate-300"><span className={`h-2.5 w-2.5 rounded-full ${formDot(item.form_key)}`} />{item.form_name}</div>
          <Summary item={item} />
          <div className="flex items-center justify-between"><time className="text-sm text-slate-400">{relativeTime(trashed && item.deleted_at ? item.deleted_at : item.submitted_at)}</time>{trashed ? <div className="flex gap-3"><Button size="sm" onClick={() => void onRestore(item)}><RotateCcw className="mr-2 h-4 w-4" />Restore</Button><DeleteConfirmation itemName="submission permanently" onDelete={() => onForceDelete(item)} /></div> : <Button size="sm" variant={isNew ? "default" : "outline"} className={isNew ? "" : "border-slate-600 bg-transparent"} onClick={() => onView(item)}><Eye className="mr-2 h-4 w-4" />View</Button>}</div>
        </article>
      })}
    </div>
  </div>
}
