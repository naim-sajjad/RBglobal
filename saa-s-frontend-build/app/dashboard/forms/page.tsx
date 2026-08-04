"use client"

import { useCallback, useEffect, useState } from "react"
import { Archive, CalendarDays, ChevronDown, Download, Eye, FileText, RotateCcw, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getErrorMessage } from "../services/api"
import {
  getCombinedSubmissions,
  getFormsSummary,
  bulkSubmissionAction,
  exportCurrentSubmissions,
  exportSelectedSubmissions,
  type CombinedSubmission,
  type FormKey,
  type FormsMeta,
  type FormSummary,
} from "../services/formsService"
import { exportContacts } from "../services/contactService"
import { exportNewsletterSubscribers } from "../services/newsletterService"
import {
  ErrorBox,
  Loading,
  PageHeader,
  SearchBox,
  panel,
  saveBlob,
  td,
  th,
  useDebounced,
} from "../website/components"
import ContactImportDialog from "../website/contacts/ContactImportDialog"
import NewsletterImportDialog from "../website/newsletter/NewsletterImportDialog"
import { SubmissionsTable } from "./components/SubmissionsTable"
import { SubmissionDetailsDrawer } from "./components/SubmissionDetailsDrawer"

const initialMeta: FormsMeta = { current_page: 1, last_page: 1, per_page: 100, total: 0 }

const formOptions: Array<{ value: FormKey; label: string }> = [
  { value: "all", label: "All Forms" },
  { value: "career_growth_course_application", label: "Career Growth Course Application" },
  { value: "job_seeker_contact", label: "Job Seeker Contact Us Form" },
  { value: "employer_contact", label: "Employer Contact Form" },
  { value: "subscribe", label: "Subscribe Form" },
  { value: "general_labour_application", label: "General Labour Application" },
  { value: "az_driver_application", label: "AZ Driver Application" },
  { value: "forklift_application", label: "Forklift Application" },
  { value: "unclassified_contact", label: "Unclassified Contact Entries" },
  { value: "unclassified_job_application", label: "Unclassified Job Applications" },
]

function statusOptions(form: FormKey) {
  if (form === "subscribe") return [["", "All statuses"], ["active", "Active"], ["unsubscribed", "Unsubscribed"], ["blocked", "Blocked"]]
  if (["job_seeker_contact", "employer_contact", "unclassified_contact"].includes(form)) return [["", "All statuses"], ["unread", "New"], ["read", "Seen"], ["archived", "Archived"]]
  if (form !== "all") return [["", "All statuses"], ["new", "New"]]
  return [["", "All statuses"]]
}

function displayDate(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "—"
}

export default function FormsAndSubmissionsPage() {
  const [tab, setTab] = useState("forms")
  const [summaries, setSummaries] = useState<FormSummary[]>([])
  const [submissions, setSubmissions] = useState<CombinedSubmission[]>([])
  const [meta, setMeta] = useState(initialMeta)
  const [form, setForm] = useState<FormKey>("all")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [contactImportOpen, setContactImportOpen] = useState(false)
  const [newsletterImportOpen, setNewsletterImportOpen] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<CombinedSubmission | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [trashed, setTrashed] = useState(false)
  const [notice, setNotice] = useState("")
  const query = useDebounced(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryData, submissionData] = await Promise.all([
        getFormsSummary(),
        getCombinedSubmissions({
          form,
          search: query,
          status,
          date_from: dateFrom,
          date_to: dateTo,
          page,
          per_page: 100,
          trashed: trashed ? "only" : "false",
        }),
      ])
      setSummaries(summaryData)
      setSubmissions(submissionData.data)
      setMeta(submissionData.meta)
      setSelectedIds(new Set())
      setError("")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, form, page, query, status, trashed])

  const selectedItems = submissions.filter((item) => selectedIds.has(item.id))
  const selectedPayload = selectedItems.map(({ form_key, record_id }) => ({ form_key, record_id }))
  const contactOnly = selectedItems.length > 0 && selectedItems.every((item) => item.record_type === "contact")

  const runBulk = async (action: "trash" | "restore" | "force_delete" | "mark_seen" | "archive") => {
    if (!selectedPayload.length) return
    if ((action === "trash" || action === "force_delete") && !window.confirm(action === "trash" ? `Move ${selectedPayload.length} submission(s) to Trash?` : `Permanently delete ${selectedPayload.length} submission(s)? This cannot be undone.`)) return
    try {
      await bulkSubmissionAction(action, selectedPayload)
      setNotice(`${selectedPayload.length} submission(s) updated successfully.`)
      await load()
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    }
  }

  const exportFilters = { form, search: query, status, date_from: dateFrom, date_to: dateTo, trashed: trashed ? "only" as const : "false" as const }

  useEffect(() => {
    void load()
  }, [load])

  const openSubmissions = (selectedForm: FormSummary["key"]) => {
    setForm(selectedForm)
    setPage(1)
    setTab("submissions")
  }

  return <>
    <PageHeader
      title="Forms and Submissions"
      description="Review website forms, entries, subscribers, and imports in one place."
      actions={<>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="border-slate-600 bg-transparent text-slate-200"><Upload className="mr-2 h-4 w-4" />Import<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent className="border-slate-700 bg-slate-900 text-slate-100"><DropdownMenuItem onSelect={() => setContactImportOpen(true)}>Contact entries</DropdownMenuItem><DropdownMenuItem onSelect={() => setNewsletterImportOpen(true)}>Newsletter subscribers</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" className="border-slate-600 bg-transparent text-slate-200"><Download className="mr-2 h-4 w-4" />Export<ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="border-slate-700 bg-slate-900 text-slate-100"><DropdownMenuItem onSelect={async () => saveBlob(await exportCurrentSubmissions(exportFilters), "form-submissions.csv")}>Current view</DropdownMenuItem><DropdownMenuItem disabled={!selectedPayload.length} onSelect={async () => saveBlob(await exportSelectedSubmissions(selectedPayload), "selected-submissions.csv")}>Selected ({selectedPayload.length})</DropdownMenuItem><DropdownMenuItem onSelect={async () => saveBlob(await exportContacts({ search: query }), "contact-entries.csv")}>Contact entries</DropdownMenuItem><DropdownMenuItem onSelect={async () => saveBlob(await exportNewsletterSubscribers({ search: query }), "newsletter-subscribers.csv")}>Newsletter subscribers</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      </>}
    />

    <ContactImportDialog open={contactImportOpen} onOpenChange={setContactImportOpen} onImported={load} />
    <NewsletterImportDialog open={newsletterImportOpen} onOpenChange={setNewsletterImportOpen} onImported={load} />

    <Tabs value={tab} onValueChange={setTab}>
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <TabsList className="w-fit border border-slate-700 bg-slate-800 text-slate-400">
          <TabsTrigger value="forms" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Forms</TabsTrigger>
          <TabsTrigger value="submissions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Submissions</TabsTrigger>
        </TabsList>
        {tab === "submissions" && <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <select value={form} onChange={(event) => { setForm(event.target.value as FormKey); setStatus(""); setPage(1) }} className="min-w-52 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
            {formOptions.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
          </select>
          <div className="w-full sm:w-72"><SearchBox value={search} onChange={(value) => { setSearch(value); setPage(1) }} /></div>
        </div>}
      </div>

      {error && <div className="mb-4"><ErrorBox message={error} /></div>}
      {notice && <div className="mb-4 rounded-md border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300">{notice}</div>}

      <TabsContent value="forms">
        <div className={`${panel} max-w-full overflow-x-auto`}>
          {loading ? <Loading /> : summaries.length === 0 ? <div className="p-12 text-center text-slate-400">No website forms were found.</div> :
            <table className="w-full min-w-[850px]">
              <thead className="bg-slate-900/50"><tr>
                {["Form Name", "Form Type", "Total Submissions", "New / Unread", "Last Updated", "Created On", "Status", "Actions"].map((heading) =>
                  <th className={th} key={heading}>{heading}</th>
                )}
              </tr></thead>
              <tbody className="divide-y divide-slate-700">
                {summaries.map((summary) => <tr key={summary.key} className="cursor-pointer hover:bg-slate-700/30" onClick={() => openSubmissions(summary.key)}>
                  <td className={td}><span className="flex items-center gap-3 font-semibold text-white"><FileText className="h-5 w-5 text-blue-400" />{summary.name}</span></td>
                  <td className={td}>{summary.type}</td>
                  <td className={td}><span className="text-lg font-semibold text-white">{summary.submissions_count.toLocaleString()}</span></td>
                  <td className={td}><span className={summary.new_submissions_count ? "font-semibold text-blue-300" : "text-slate-400"}>{summary.new_submissions_count.toLocaleString()}</span></td>
                  <td className={td}>{displayDate(summary.last_updated_at)}</td>
                  <td className={td}>{displayDate(summary.created_at)}</td>
                  <td className={td}><span className="rounded-full border border-emerald-800 bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-300">Active</span></td>
                  <td className={td}><Button size="sm" variant="outline" className="border-slate-600 bg-transparent text-slate-200" onClick={(event) => { event.stopPropagation(); openSubmissions(summary.key) }}>View submissions</Button></td>
                </tr>)}
              </tbody>
            </table>}
        </div>
      </TabsContent>

      <TabsContent value="submissions">
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
            {statusOptions(form).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <label className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="From date" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); setPage(1) }} className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 pr-2 text-sm text-white" /></label>
          <label className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><input aria-label="To date" type="date" value={dateTo} onChange={(event) => { setDateTo(event.target.value); setPage(1) }} className="w-full rounded-md border border-slate-600 bg-slate-800 py-2 pl-9 pr-2 text-sm text-white" /></label>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Button variant={trashed ? "default" : "outline"} className={trashed ? "" : "border-slate-600 bg-transparent text-slate-200"} onClick={() => { setTrashed((value) => !value); setPage(1) }}><Trash2 className="mr-2 h-4 w-4" />{trashed ? "Back to submissions" : "Trash"}</Button>
          {selectedItems.length > 0 && <div className="flex flex-wrap items-center gap-2 rounded-lg border border-blue-700 bg-blue-950/40 p-2">
            <span className="px-2 text-sm font-semibold text-blue-200">{selectedItems.length} selected</span>
            <Button size="sm" variant="outline" className="border-slate-600 bg-transparent" onClick={async () => saveBlob(await exportSelectedSubmissions(selectedPayload), "selected-submissions.csv")}><Download className="mr-2 h-4 w-4" />Export</Button>
            {trashed ? <><Button size="sm" onClick={() => void runBulk("restore")}><RotateCcw className="mr-2 h-4 w-4" />Restore</Button><Button size="sm" variant="destructive" onClick={() => void runBulk("force_delete")}><Trash2 className="mr-2 h-4 w-4" />Delete permanently</Button></> : <><Button size="sm" variant="destructive" onClick={() => void runBulk("trash")}><Trash2 className="mr-2 h-4 w-4" />Move to Trash</Button>{contactOnly && <><Button size="sm" variant="outline" className="border-slate-600 bg-transparent" onClick={() => void runBulk("mark_seen")}><Eye className="mr-2 h-4 w-4" />Mark seen</Button><Button size="sm" variant="outline" className="border-slate-600 bg-transparent" onClick={() => void runBulk("archive")}><Archive className="mr-2 h-4 w-4" />Archive</Button></>}</>}
            <Button size="icon" variant="ghost" title="Clear selection" onClick={() => setSelectedIds(new Set())}><X className="h-4 w-4" /></Button>
          </div>}
        </div>

        <SubmissionsTable items={submissions} loading={loading} onView={setSelectedSubmission} onRetry={load} selectedIds={selectedIds} onToggle={(item) => setSelectedIds((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next })} onToggleAll={() => setSelectedIds((current) => submissions.every((item) => current.has(item.id)) ? new Set() : new Set(submissions.map((item) => item.id)))} trashed={trashed} onRestore={async (item) => { await bulkSubmissionAction("restore", [{ form_key: item.form_key, record_id: item.record_id }]); await load() }} onForceDelete={async (item) => { await bulkSubmissionAction("force_delete", [{ form_key: item.form_key, record_id: item.record_id }]); await load() }} />

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
          <span>Showing page {meta.current_page} of {meta.last_page} · {meta.total.toLocaleString()} submissions</span>
          {meta.total > 100 && <div className="flex gap-2">
            <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" disabled={meta.current_page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</Button>
            <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" disabled={meta.current_page >= meta.last_page || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
          </div>}
        </div>
      </TabsContent>
    </Tabs>
    <SubmissionDetailsDrawer
      item={selectedSubmission}
      open={Boolean(selectedSubmission)}
      onOpenChange={(open) => { if (!open) setSelectedSubmission(null) }}
      onChanged={load}
      onDeleted={load}
    />
  </>
}
