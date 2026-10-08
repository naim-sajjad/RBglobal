"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getJobCategories, saveJobCategory, deleteJobCategory, type JobCategory } from "../../../services/jobService"
import { getErrorMessage } from "../../../services/api"
import { ErrorBox, PageHeader, panel, th, td } from "../../components"
import DeleteConfirmation from "../../DeleteConfirmation"

export default function JobCategoriesPage() {
  const [items, setItems] = useState<JobCategory[]>([])
  const [name, setName] = useState("")
  const [editing, setEditing] = useState<number | undefined>()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const load = async () => setItems(await getJobCategories())
  useEffect(() => { load().catch(e => setError(getErrorMessage(e))).finally(() => setLoading(false)) }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try { await saveJobCategory(name.trim(), editing); setName(""); setEditing(undefined); await load() }
    catch (e) { setError(getErrorMessage(e)) }
    finally { setSaving(false) }
  }

  return <>
    <PageHeader title="Job categories" description="Manage the categories available when adding or editing jobs." actions={<Link href="/dashboard/website/jobs"><Button variant="outline">Back to jobs</Button></Link>} />
    {error && <ErrorBox message={error} />}
    <form onSubmit={submit} className={`${panel} mt-4 flex flex-wrap items-end gap-3 p-5`}>
      <label className="min-w-56 flex-1 text-sm">Category name<Input required maxLength={255} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Hospitality" className="mt-2 border-slate-600 bg-slate-900" /></label>
      <Button disabled={saving || !name.trim()}>{saving ? "Saving..." : editing ? "Save category" : "Add category"}</Button>
      {editing && <Button type="button" variant="outline" onClick={() => { setEditing(undefined); setName("") }}>Cancel</Button>}
    </form>
    <div className={`${panel} mt-5 overflow-x-auto`}><table className="w-full"><thead><tr><th className={th}>Category</th><th className={th}>Actions</th></tr></thead><tbody className="divide-y divide-slate-700">
      {loading ? <tr><td colSpan={2} className={td}>Loading categories...</td></tr> : items.map(item => <tr key={item.id}><td className={td}>{item.name}</td><td className={td}><div className="flex items-center gap-4"><button type="button" className="text-blue-400 hover:text-blue-300" onClick={() => { setEditing(item.id); setName(item.name); setError("") }}>Edit</button><DeleteConfirmation itemName="job category" description={`Delete “${item.name}”? Categories assigned to jobs cannot be deleted.`} onDelete={async () => { await deleteJobCategory(item.id); if (editing === item.id) { setEditing(undefined); setName("") }; await load() }} /></div></td></tr>)}
    </tbody></table></div>
  </>
}
