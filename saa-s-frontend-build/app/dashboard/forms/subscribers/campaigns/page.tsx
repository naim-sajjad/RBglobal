"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import BlogEditor from "../../../website/blogs/BlogEditor"
import { ErrorBox, PageHeader, panel, th, td } from "../../../website/components"
import { getErrorMessage } from "../../../services/api"
import { getCampaigns, saveCampaign, testCampaign, sendCampaign, type Campaign } from "../../../services/campaignService"

export default function CampaignsPage() {
  const [items, setItems] = useState<Campaign[]>([])
  const [id, setId] = useState<number | undefined>()
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState<Campaign["audience"]>("all")
  const [testEmail, setTestEmail] = useState("")
  const [review, setReview] = useState<Campaign | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const load = async () => setItems(await getCampaigns())
  useEffect(() => { void load().catch(e => setError(getErrorMessage(e))) }, [])
  async function action(kind: "draft" | "test" | "review") {
    setBusy(true); setError(""); setNotice("")
    try {
      const saved = await saveCampaign({ subject, body, audience }, id)
      setId(saved.id)
      if (kind === "test") { await testCampaign(saved.id, testEmail); setNotice("Test email sent to " + testEmail) }
      else if (kind === "review") setReview(saved)
      else setNotice("Draft saved.")
      await load()
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setBusy(false) }
  }
  return <>
    <PageHeader title="Promotional emails" description="Compose a newsletter, test it, and review the audience before sending." actions={<Link href="/dashboard/forms/subscribers"><Button variant="outline">Back to subscribers</Button></Link>} />
    {error && <ErrorBox message={error} />}{notice && <p role="status" className="mb-4 text-green-400">{notice}</p>}
    {!review ? <form onSubmit={event => { event.preventDefault(); void action("draft") }} className={`${panel} max-w-5xl space-y-5 p-6`}>
      <label className="block text-sm">Subject *<Input required maxLength={255} value={subject} onChange={e => setSubject(e.target.value)} className="mt-2 border-slate-600 bg-slate-900" /></label>
      <label className="block text-sm">Audience<select value={audience} onChange={e => setAudience(e.target.value as Campaign["audience"])} className="mt-2 block rounded border border-slate-600 bg-slate-900 p-2"><option value="all">All opted-in subscribers</option><option value="seeker">Job Seekers</option><option value="employer">Employers</option></select></label>
      <BlogEditor label="Email message" title={subject || "Email subject"} value={body} format="html" onChange={setBody} />
      <p className="text-sm text-slate-400">Your business details and an unsubscribe link are added automatically.</p>
      <div className="flex flex-wrap gap-3"><Button disabled={busy || !subject.trim() || !body.trim()}>Save draft</Button><Button type="button" disabled={busy || !subject.trim() || !body.trim()} onClick={() => void action("review")}>Review and send</Button><Button type="button" variant="outline" disabled={busy} onClick={() => { setId(undefined); setSubject(""); setBody(""); setAudience("all"); setNotice("") }}>New email</Button></div>
      <div className="flex flex-wrap items-end gap-3 border-t border-slate-700 pt-5"><label className="flex-1 text-sm">Send a test to your email<Input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Your email address" className="mt-2 border-slate-600 bg-slate-900 placeholder:text-slate-500" /></label><Button type="button" variant="outline" disabled={busy || !testEmail || !subject.trim() || !body.trim()} onClick={() => void action("test")}>Send test email</Button></div>
    </form> : <div className={`${panel} max-w-5xl space-y-5 p-6`}>
      <h2 className="text-xl font-semibold">Review email</h2><p>Subject: <b>{review.subject}</b></p><p>Audience: {review.audience === "all" ? "All subscribers" : review.audience === "seeker" ? "Job Seekers" : "Employers"} · <b>{review.recipient_count} eligible recipients</b></p>
      <div className="rounded-xl bg-white p-6 text-slate-900 [&_p]:my-3 [&_a]:text-blue-700 [&_a]:underline [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_img]:max-w-full" dangerouslySetInnerHTML={{ __html: review.body }} />
      <p className="text-sm text-slate-400">Only active, opted-in subscribers receive this email. Unsubscribed, blocked and deleted subscribers are excluded.</p>
      <div className="flex gap-3"><Button disabled={busy || !review.recipient_count} onClick={async () => { setBusy(true); setError(""); try { await sendCampaign(review.id, review.recipient_count); setReview(null); setId(undefined); setSubject(""); setBody(""); setNotice("Campaign queued. Delivery progress is shown below."); await load() } catch (e) { setError(getErrorMessage(e)) } finally { setBusy(false) } }}>Confirm send to {review.recipient_count} subscribers</Button><Button variant="outline" disabled={busy} onClick={() => setReview(null)}>Back to editor</Button></div>
    </div>}
    <div className="mt-8 flex items-center justify-between"><h2 className="text-xl font-semibold">Email history</h2><Button variant="outline" disabled={busy} onClick={() => void load().catch(e => setError(getErrorMessage(e)))}>Refresh status</Button></div>
    <div className={`${panel} mt-4 overflow-x-auto`}><table className="w-full"><thead><tr>{["Subject", "Status", "Recipients", "Sent", "Pending", "Failed", "Skipped", "Actions"].map(label => <th className={th} key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-700">{!items.length && <tr><td colSpan={8} className={td}>No promotional emails yet.</td></tr>}{items.map(item => <tr key={item.id}><td className={td}>{item.subject}</td><td className={td}>{item.status.replaceAll("_", " ")}</td><td className={td}>{item.recipient_count}</td><td className={td}>{item.sent_count}</td><td className={td}>{item.pending_count}</td><td className={td}>{item.failed_count}</td><td className={td}>{item.skipped_count}</td><td className={td}>{item.status === "draft" && <button type="button" disabled={busy} className="text-blue-400" onClick={() => { setId(item.id); setSubject(item.subject); setBody(item.body); setAudience(item.audience); setReview(null); setError("") }}>Edit draft</button>}</td></tr>)}</tbody></table></div>
  </>
}
