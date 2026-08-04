"use client"

import { useCallback, useEffect, useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getErrorMessage } from "../../services/api"
import {
  deleteContactSubmission,
  exportContacts,
  getContactSubmissions,
  updateContactSubmissionStatus,
  type ContactSubmission,
} from "../../services/contactService"
import {
  ErrorBox,
  ExportButton,
  Loading,
  PageHeader,
  SearchBox,
  panel,
  saveBlob,
  td,
  th,
  useDebounced,
} from "../components"
import ContactImportDialog from "./ContactImportDialog"
import DeleteConfirmation from "../DeleteConfirmation"

function getFormDetails(item: ContactSubmission) {
  const source = item.source?.trim() || ""

  if (source.startsWith("Apply Form - ")) {
    return {
      label: `${source.replace("Apply Form - ", "")} Application`,
      dot: "bg-blue-500",
      text: "text-blue-300",
    }
  }

  if (source.startsWith("Career Growth - ")) {
    return {
      label: "Career Growth Form",
      dot: "bg-violet-500",
      text: "text-violet-300",
    }
  }

  if (item.import_batch_id || item.imported_at || item.import_source_file) {
    return {
      label: "Imported Contact",
      dot: "bg-amber-400",
      text: "text-amber-300",
    }
  }

  return {
    label: "Contact Form",
    dot: "bg-emerald-500",
    text: "text-emerald-300",
  }
}

export default function ContactsPage() {
  const [items, setItems] = useState<ContactSubmission[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [importOpen, setImportOpen] = useState(false)
  const query = useDebounced(search)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems((await getContactSubmissions({ search: query, per_page: 100 })).data)
      setError("")
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    void load()
  }, [load])

  return <>
    <PageHeader
      title="Contact form entries"
      description="Messages submitted through the public website."
      actions={<>
        <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200" onClick={() => setImportOpen(true)}>
          <Upload className="mr-2 h-4 w-4" />Import CSV
        </Button>
        <ExportButton onClick={async () => saveBlob(await exportContacts({ search: query }), "contact-entries.csv")} />
      </>}
    />
    <ContactImportDialog open={importOpen} onOpenChange={setImportOpen} onImported={load} />
    <SearchBox value={search} onChange={setSearch} />
    {error && <div className="mt-4"><ErrorBox message={error} /></div>}

    <div className={`${panel} mt-4 max-w-full overflow-x-auto overscroll-x-contain`}>
      {loading ? <Loading /> : <table className="min-w-max">
        <thead className="bg-slate-900/50">
          <tr>
            {["Form", "First name", "Last name", "Email 1 / Email 2", "Phone 1 / Phone 2", "Created", "Activity", "Application / message", "Source / language", "Status", "Actions"].map((heading) =>
              <th className={`${th} whitespace-nowrap`} key={heading}>{heading}</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {items.map((item) => {
            const form = getFormDetails(item)
            return <tr key={item.id}>
              <td className={`${td} min-w-52`}>
                <span className={`inline-flex items-center gap-2 font-medium ${form.text}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${form.dot}`} />
                  {form.label}
                </span>
              </td>
              <td className={td}>{item.first_name || "—"}</td>
              <td className={td}>{item.last_name || "—"}</td>
              <td className={td}>{item.email || "—"}<br/><span className="text-slate-400">{item.secondary_email}</span></td>
              <td className={td}>{item.phone || "—"}<br/><span className="text-slate-400">{item.secondary_phone}</span></td>
              <td className={td}>{new Date(item.original_created_at || item.created_at).toLocaleString()}</td>
              <td className={td}>{item.last_activity || "Submitted a form"}<br/><span className="text-slate-400">{item.email_subscriber_status}</span></td>
              <td className={`${td} min-w-64 max-w-sm`}>
                <span className="font-medium text-white">{item.subject || "Contact message"}</span>
                <p className="mt-1 line-clamp-3 whitespace-pre-line text-slate-400">{item.message || "—"}</p>
              </td>
              <td className={td}>{item.source || "Form Submission"}<br/><span className="text-slate-400">{item.language || "—"}</span></td>
              <td className={td}>
                <select
                  value={item.status}
                  onChange={async (event) => {
                    await updateContactSubmissionStatus(item.id, event.target.value as ContactSubmission["status"])
                    void load()
                  }}
                  className="cursor-pointer rounded bg-slate-700 p-2"
                >
                  <option>unread</option>
                  <option>read</option>
                  <option>archived</option>
                </select>
              </td>
              <td className={td}>
                <DeleteConfirmation
                  itemName="contact entry"
                  description={`Delete the contact entry for ${item.email || item.name || "this person"}? This cannot be undone.`}
                  onDelete={async () => {
                    await deleteContactSubmission(item.id)
                    await load()
                  }}
                />
              </td>
            </tr>
          })}
        </tbody>
      </table>}
    </div>
  </>
}
