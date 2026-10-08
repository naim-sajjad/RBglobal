"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getNewsletterSubscribers, updateNewsletterSubscriberStatus, exportNewsletterSubscribers, type NewsletterSubscriber, type NewsletterSubscriberStatus } from "../../services/newsletterService"
import { getErrorMessage } from "../../services/api"
import { ErrorBox, PageHeader, SearchBox, Loading, panel, th, td, useDebounced } from "../../website/components"

export default function SubscribersPage() {
  const [items, setItems] = useState<NewsletterSubscriber[]>([])
  const [search, setSearch] = useState("")
  const query = useDebounced(search)
  const [status, setStatus] = useState<NewsletterSubscriberStatus | "">("")
  const [type, setType] = useState("")
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getNewsletterSubscribers({ search: query, status, subscriber_type: type, page, per_page: 25 })
      setItems(result.data); setPages(result.meta.last_page); setTotal(result.meta.total); setError("")
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setLoading(false) }
  }, [query, status, type, page])
  useEffect(() => { void load() }, [load])
  async function exportCsv() {
    setExporting(true)
    try {
      const blob = await exportNewsletterSubscribers({ search: query, status, subscriber_type: type })
      const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "subscribers.csv"; link.click(); URL.revokeObjectURL(url)
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setExporting(false) }
  }
  return <>
    <PageHeader title="Subscribers" description="Newsletter subscribers from website subscription forms." actions={<><Link href="/dashboard/forms/subscribers/campaigns"><Button>Create promotional email</Button></Link><Button variant="outline" disabled={exporting} onClick={exportCsv}>{exporting ? "Exporting..." : "Export CSV"}</Button></>} />
    <p className="mb-5 text-sm text-slate-400">Email campaigns include only active subscribers with newsletter consent. Contact-form submissions are kept separate.</p>
    <div className="mb-4 flex flex-wrap gap-3"><SearchBox value={search} onChange={value => { setSearch(value); setPage(1) }} /><select aria-label="Subscriber status" value={status} onChange={e => { setStatus(e.target.value as NewsletterSubscriberStatus | ""); setPage(1) }} className="rounded border border-slate-600 bg-slate-800 px-3"><option value="">All statuses</option><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option><option value="blocked">Blocked</option></select><select aria-label="Subscriber type" value={type} onChange={e => { setType(e.target.value); setPage(1) }} className="rounded border border-slate-600 bg-slate-800 px-3"><option value="">All types</option><option value="job_seeker">Job Seeker</option><option value="employer">Employer</option></select></div>
    {error && <ErrorBox message={error} />}
    <div className={`${panel} mt-4 overflow-x-auto`}>{loading ? <Loading /> : <table className="w-full"><thead><tr>{["Email", "Type", "Consent", "Status", "Subscribed", "Source"].map(label => <th key={label} className={th}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-700">{!items.length && <tr><td colSpan={6} className={td}>No subscribers match your filters.</td></tr>}{items.map(item => <tr key={item.id}><td className={td}>{item.email}{item.name && <p className="text-slate-400">{item.name}</p>}</td><td className={td}>{(item.subscriber_type === "job_seeker" ? "Job Seeker" : item.subscriber_type === "employer" ? "Employer" : item.subscriber_type) || (item.role === "seeker" ? "Job Seeker" : item.role === "employer" ? "Employer" : "—")}</td><td className={td}>{item.consent ? "Opted in" : "No consent"}</td><td className={td}><select aria-label={`Status for ${item.email}`} value={item.status} onChange={async e => { try { await updateNewsletterSubscriberStatus(item.id, e.target.value as NewsletterSubscriberStatus); await load() } catch (error) { setError(getErrorMessage(error)) } }} className="rounded bg-slate-900 p-2"><option value="active">Active</option><option value="unsubscribed">Unsubscribed</option><option value="blocked">Blocked</option></select></td><td className={td}>{new Date(item.subscribed_at || item.created_at).toLocaleString()}</td><td className={td}>{item.source || "Website"}</td></tr>)}</tbody></table>}</div>
    <div className="mt-4 flex items-center gap-4 text-sm"><span>{total} subscribers · Page {page} of {pages}</span><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Previous</Button><Button variant="outline" disabled={page >= pages || loading} onClick={() => setPage(page + 1)}>Next</Button></div>
  </>
}
