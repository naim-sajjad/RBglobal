"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "../../../services/api"
import {
  deleteContactSubmission,
  getContactSubmission,
  updateContactSubmissionStatus,
  type ContactSubmission,
} from "../../../services/contactService"
import {
  deleteNewsletterSubscriber,
  getNewsletterSubscriber,
  updateNewsletterSubscriberStatus,
  type NewsletterSubscriber,
} from "../../../services/newsletterService"
import { ErrorBox, Loading, PageHeader, panel } from "../../../website/components"
import DeleteConfirmation from "../../../website/DeleteConfirmation"

function value(content: unknown) {
  if (content === null || content === undefined || content === "") return "—"
  if (typeof content === "boolean") return content ? "Yes" : "No"
  return String(content)
}

function Detail({ label, children }: { label: string; children: unknown }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
    <dd className="mt-1 whitespace-pre-wrap break-words text-slate-100">{value(children)}</dd>
  </div>
}

export default function SubmissionDetailsPage() {
  const params = useParams<{ form: string; id: string }>()
  const router = useRouter()
  const isNewsletter = params.form === "newsletter"
  const [contact, setContact] = useState<ContactSubmission | null>(null)
  const [subscriber, setSubscriber] = useState<NewsletterSubscriber | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (isNewsletter) setSubscriber(await getNewsletterSubscriber(params.id))
      else setContact(await getContactSubmission(params.id))
      setError("")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [isNewsletter, params.id])

  useEffect(() => {
    void load()
  }, [load])

  return <>
    <PageHeader
      title={isNewsletter ? "Newsletter subscriber details" : "Contact submission details"}
      description="View the complete original record and manage its current status."
      actions={<Link href="/dashboard/forms"><Button variant="outline" className="border-slate-600 bg-transparent text-slate-200"><ArrowLeft className="mr-2 h-4 w-4" />Back to submissions</Button></Link>}
    />
    {error && <ErrorBox message={error} />}
    {loading ? <Loading /> : subscriber ? <div className={`${panel} p-5`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{subscriber.email}</h2>
        <div className="flex items-center gap-3">
          <select value={subscriber.status} onChange={async (event) => { await updateNewsletterSubscriberStatus(subscriber.id, event.target.value as NewsletterSubscriber["status"]); await load() }} className="rounded bg-slate-700 p-2">
            <option value="active">Active</option><option value="unsubscribed">Unsubscribed</option><option value="blocked">Blocked</option>
          </select>
          <DeleteConfirmation itemName="newsletter subscriber" description={`Delete ${subscriber.email}? This cannot be undone.`} onDelete={async () => { await deleteNewsletterSubscriber(subscriber.id); router.push("/dashboard/forms") }} />
        </div>
      </div>
      <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Detail label="Name">{subscriber.name}</Detail><Detail label="Email">{subscriber.email}</Detail>
        <Detail label="Subscriber type">{subscriber.subscriber_type || subscriber.role}</Detail><Detail label="Consent">{subscriber.consent}</Detail>
        <Detail label="Consent at">{subscriber.consent_at}</Detail><Detail label="Status">{subscriber.status}</Detail>
        <Detail label="Source">{subscriber.source}</Detail><Detail label="Original submission">{subscriber.original_submitted_at}</Detail>
        <Detail label="Subscribed at">{subscriber.subscribed_at}</Detail><Detail label="Unsubscribed at">{subscriber.unsubscribed_at}</Detail>
        <Detail label="Import file">{subscriber.import_source_file}</Detail><Detail label="Imported at">{subscriber.imported_at}</Detail>
        <Detail label="Import batch">{subscriber.import_batch_id}</Detail><Detail label="Created">{subscriber.created_at}</Detail>
        <Detail label="Last updated">{subscriber.updated_at}</Detail>
      </dl>
    </div> : contact ? <div className={`${panel} p-5`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{contact.subject || contact.name || contact.email}</h2>
        <div className="flex items-center gap-3">
          <select value={contact.status} onChange={async (event) => { await updateContactSubmissionStatus(contact.id, event.target.value as ContactSubmission["status"]); await load() }} className="rounded bg-slate-700 p-2">
            <option value="unread">Unread</option><option value="read">Read</option><option value="archived">Archived</option>
          </select>
          <DeleteConfirmation itemName="contact submission" description={`Delete the entry for ${contact.email || contact.name}? This cannot be undone.`} onDelete={async () => { await deleteContactSubmission(contact.id); router.push("/dashboard/forms") }} />
        </div>
      </div>
      <dl className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Detail label="First name">{contact.first_name}</Detail><Detail label="Last name">{contact.last_name}</Detail>
        <Detail label="Email">{contact.email}</Detail><Detail label="Secondary email">{contact.secondary_email}</Detail>
        <Detail label="Phone">{contact.phone}</Detail><Detail label="Secondary phone">{contact.secondary_phone}</Detail>
        <Detail label="Location">{contact.location}</Detail><Detail label="Role">{contact.role}</Detail>
        <Detail label="Subject">{contact.subject}</Detail><Detail label="Source">{contact.source}</Detail>
        <Detail label="Language">{contact.language}</Detail><Detail label="Status">{contact.status}</Detail>
        <Detail label="Last activity">{contact.last_activity}</Detail><Detail label="Last activity at">{contact.last_activity_at}</Detail>
        <Detail label="Email subscriber status">{contact.email_subscriber_status}</Detail><Detail label="SMS subscriber status">{contact.sms_subscriber_status}</Detail>
        <Detail label="Original submission">{contact.original_created_at}</Detail><Detail label="Import file">{contact.import_source_file}</Detail>
        <Detail label="Imported at">{contact.imported_at}</Detail><Detail label="Import batch">{contact.import_batch_id}</Detail>
        <Detail label="Created">{contact.created_at}</Detail><Detail label="Last updated">{contact.updated_at}</Detail>
        <div className="md:col-span-2 xl:col-span-3"><Detail label="Message">{contact.message}</Detail></div>
      </dl>
    </div> : !error && <div className="p-12 text-center text-slate-400">Submission not found.</div>}
  </>
}
