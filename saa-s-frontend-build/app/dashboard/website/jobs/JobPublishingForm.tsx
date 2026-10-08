"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createJob, getAdminJob, updateJob, getJobCategories, type JobCategory, type JobStatus } from "../../services/jobService"
import { getErrorMessage } from "../../services/api"
import { ErrorBox, PageHeader, panel } from "../components"
import BlogEditor from "../blogs/BlogEditor"
import PublicationTiming from "../PublicationTiming"

type Fields = {
  title: string; slug: string; location: string; category: string; bullets: string; note: string; description: string
  application_email: string; application_url: string; status: JobStatus; published_at: string
}
const inputClass = "mt-2 border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 placeholder:font-normal placeholder:opacity-70"
const sectionClass = `${panel} space-y-5 p-6`

export default function JobPublishingForm({ id }: { id?: string }) {
  const router = useRouter()
  const [data, setData] = useState<Fields>({ title: "", slug: "", location: "", category: "", bullets: "", note: "", description: "", application_email: "", application_url: "", status: "draft", published_at: "" })
  const [categories, setCategories] = useState<JobCategory[]>([])
  const [publishMode, setPublishMode] = useState<"immediate" | "scheduled">("immediate")
  const [originalPublishAt, setOriginalPublishAt] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!id)
  const [loadFailed, setLoadFailed] = useState(false)
  const [image, setImage] = useState<File | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  useEffect(() => {
    const refresh = () => { getJobCategories().then(setCategories).catch(e => setError(getErrorMessage(e))) }
    refresh()
    window.addEventListener("focus", refresh)
    if (id) getAdminJob(id).then(job => {
      const date = job.published_at ? new Date(job.published_at) : null
      setOriginalPublishAt(job.published_at || null)
      setPublishMode(date && date.getTime() > Date.now() ? "scheduled" : "immediate")
      setData({ title: job.title, slug: job.slug, location: job.location, category: job.category, bullets: job.bullets.join("\n"), note: job.note || "", description: job.description || "", application_email: job.application_email || "", application_url: job.application_url || "", status: job.status, published_at: date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "" })
      setExistingImage(job.image_url || null)
    }).catch(e => { setError(getErrorMessage(e)); setLoadFailed(true) }).finally(() => setLoading(false))
    return () => window.removeEventListener("focus", refresh)
  }, [id])

  useEffect(() => {
    if (!image) { setPreviewImage(null); return }
    const url = URL.createObjectURL(image)
    setPreviewImage(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const set = (key: keyof Fields, value: string) => setData(previous => ({ ...previous, [key]: value }))
  const shownImage = previewImage || existingImage

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (data.status === "published" && publishMode === "scheduled" && (!data.published_at || !Number.isFinite(new Date(data.published_at).getTime()) || new Date(data.published_at).getTime() <= Date.now())) { setError("Choose a future date and time to schedule publication."); return }
    if (image && (image.size > 5 * 1024 * 1024 || !image.type.startsWith("image/"))) { setError("Choose an image smaller than 5 MB."); return }
    setSaving(true)
    try {
      const form = new FormData()
      for (const key of ["title", "slug", "location", "category", "note", "description", "application_email", "application_url", "status"] as const) form.append(key, data[key].trim())
      form.append("published_at", publishMode === "scheduled" && data.published_at ? new Date(data.published_at).toISOString() : originalPublishAt && new Date(originalPublishAt).getTime() <= Date.now() ? originalPublishAt : "")
      data.bullets.split("\n").map(item => item.trim()).filter(Boolean).forEach(item => form.append("bullets[]", item))
      if (image) form.append("image", image)
      id ? await updateJob(id, form) : await createJob(form)
      router.push("/dashboard/website/jobs")
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setSaving(false) }
  }

  return <>
    <PageHeader title={id ? "Edit job" : "Add new job"} description="Prepare the job listing, write the detail page, and publish when ready." />
    {error && <ErrorBox message={error} />}
    {loading ? <p className="mt-5 text-slate-400">Loading job...</p> : <form onSubmit={submit} className="max-w-5xl space-y-6">
      <fieldset disabled={saving || loadFailed} className={sectionClass}>
        <legend className="px-2 text-lg font-semibold">Job listing</legend>
        <p className="text-sm text-slate-400">Title, location, category and image appear on both pages. Short requirements and the note appear on the job card.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm">Job title *<Input required maxLength={255} value={data.title} onChange={e => set("title", e.target.value)} placeholder="AZ Driver | Ajax, ON" className={inputClass} /></label>
          <label className="text-sm">Location *<Input required maxLength={255} value={data.location} onChange={e => set("location", e.target.value)} placeholder="Ajax, ON" className={inputClass} /></label>
          <label className="text-sm">Category *<select required value={data.category} onChange={e => set("category", e.target.value)} className={`mt-2 block w-full rounded-md border border-slate-600 bg-slate-900 p-2.5 ${data.category ? "text-slate-100" : "text-slate-500"}`}><option value="">Select category</option>{data.category && !categories.some(item => item.name === data.category) && <option>{data.category}</option>}{categories.map(item => <option key={item.id}>{item.name}</option>)}</select><Link href="/dashboard/website/jobs/categories" target="_blank" className="mt-2 inline-block text-xs text-blue-400">Manage categories</Link></label>
          <label className="text-sm">Page URL slug<Input maxLength={255} value={data.slug} onChange={e => set("slug", e.target.value)} placeholder="Generated automatically if left blank" className={inputClass} /></label>
        </div>
        <label className="block text-sm">Job image<Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} className={inputClass} /><p className="mt-2 text-xs text-slate-400">Landscape image, up to 5 MB. Used on the card and detail page.</p></label>
        {shownImage && <img src={shownImage} alt="Job image preview" className="max-h-60 w-full max-w-md rounded-xl object-cover" />}
        <label className="block text-sm">Card requirements<Textarea value={data.bullets} onChange={e => set("bullets", e.target.value)} placeholder={"Minimum 6 months of experience\nWeekend availability"} className={`${inputClass} min-h-32`} /><p className="mt-2 text-xs text-slate-400">One short requirement per line, up to 500 characters each.</p></label>
        <label className="block text-sm">Short note<Textarea maxLength={1000} value={data.note} onChange={e => set("note", e.target.value)} placeholder="Hiring 2 individuals for this role" className={inputClass} /><p className="mt-2 text-xs text-slate-400">Optional. Also appears below the title on the detail page.</p></label>
      </fieldset>
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold">Job detail page</h2>
        <p className="text-sm text-slate-400">Use the editor for the full description, responsibilities and qualifications. If left empty, the detail page shows the card requirements.</p>
        <BlogEditor label="Job details" value={data.description} format="html" title={data.title || "Job title"} excerpt={data.note} image={shownImage} onChange={value => set("description", value)} />
      </div>
      <fieldset disabled={saving || loadFailed} className={sectionClass}>
        <legend className="px-2 text-lg font-semibold">Publishing</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm">Status *<select value={data.status} onChange={e => set("status", e.target.value)} className="mt-2 block w-full rounded-md border border-slate-600 bg-slate-900 p-2.5"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select></label>
        </div>
        {data.status === "published" && <PublicationTiming mode={publishMode} onModeChange={setPublishMode} value={data.published_at} onChange={value => set("published_at", value)} />}
        <p className="text-sm text-slate-400">Choose Published to show the job immediately or schedule it. Draft, closed and archived jobs stay hidden.</p>
      </fieldset>
      <div className="flex gap-3"><Button disabled={saving || loadFailed}>{saving ? "Saving..." : data.status === "published" ? publishMode === "scheduled" ? "Schedule job" : "Save and publish job" : "Save job"}</Button><Link href="/dashboard/website/jobs"><Button type="button" variant="outline">Cancel</Button></Link></div>
    </form>}
  </>
}
