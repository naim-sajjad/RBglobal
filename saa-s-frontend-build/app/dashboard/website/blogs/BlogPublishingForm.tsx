"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { createBlogPost, getAdminBlogPost, getBlogCategories, updateBlogPost, type BlogCategory, type BlogPost } from "../../services/blogService"
import { getErrorMessage } from "../../services/api"
import { ErrorBox, PageHeader, panel } from "../components"
import BlogEditor from "./BlogEditor"
import PublicationTiming from "../PublicationTiming"

const inputClass = "mt-2 border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 placeholder:font-normal placeholder:opacity-70"
const sectionClass = `${panel} space-y-5 p-6`

export default function BlogPublishingForm({ id }: { id?: string }) {
  const router = useRouter()
  const [data, setData] = useState<Partial<BlogPost>>({ title: "", slug: "", excerpt: "", content: "", category_id: "", status: "draft", content_format: "markdown" })
  const [publishAt, setPublishAt] = useState("")
  const [publishMode, setPublishMode] = useState<"immediate" | "scheduled">("immediate")
  const [categories, setCategories] = useState<BlogCategory[]>([])
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(!!id)
  const [loadFailed, setLoadFailed] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const refresh = () => { getBlogCategories({ per_page: 100 }).then(result => setCategories(result.data)).catch(e => setError(getErrorMessage(e))) }
    refresh()
    window.addEventListener("focus", refresh)
    if (id) getAdminBlogPost(id).then(post => {
      setData(post)
      if (post.published_at) {
        const date = new Date(post.published_at)
        setPublishMode(date.getTime() > Date.now() ? "scheduled" : "immediate")
        setPublishAt(new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16))
      }
    }).catch(e => { setError(getErrorMessage(e)); setLoadFailed(true) }).finally(() => setLoading(false))
    return () => window.removeEventListener("focus", refresh)
  }, [id])

  useEffect(() => {
    if (!image) { setImagePreview(null); return }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const set = (key: keyof BlogPost, value: string) => setData(previous => ({ ...previous, [key]: value }))
  const shownImage = imagePreview || data.featured_image_url

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (data.status === "published" && publishMode === "scheduled" && (!publishAt || !Number.isFinite(new Date(publishAt).getTime()) || new Date(publishAt).getTime() <= Date.now())) { setError("Choose a future date and time to schedule publication."); return }
    if (!data.content?.trim()) { setError("Please enter article content."); return }
    if (image && (image.size > 5 * 1024 * 1024 || !image.type.startsWith("image/"))) { setError("Choose an image smaller than 5 MB."); return }
    setSaving(true)
    try {
      const form = new FormData()
      for (const key of ["title", "slug", "excerpt", "content", "category_id", "status", "content_format", "cta_title", "cta_description", "cta_button_label", "cta_button_url"] as const) form.append(key, String(data[key] ?? ""))
      form.append("published_at", publishMode === "scheduled" && publishAt ? new Date(publishAt).toISOString() : data.published_at && new Date(data.published_at).getTime() <= Date.now() ? data.published_at : "")
      form.append("seo_title", data.title || "")
      form.append("meta_description", (data.excerpt || "").slice(0, 320))
      form.append("reading_time", "")
      if (image) form.append("featured_image", image)
      id ? await updateBlogPost(id, form) : await createBlogPost(form)
      router.push("/dashboard/website/blogs")
    } catch (e) { setError(getErrorMessage(e)) }
    finally { setSaving(false) }
  }

  return <>
    <PageHeader title={id ? "Edit blog post" : "Add new blog post"} description="Prepare the Insights listing, write the article, and publish when ready." />
    {error && <ErrorBox message={error} />}
    {loading ? <p className="mt-5 text-slate-400">Loading blog post...</p> : <form onSubmit={submit} className="max-w-5xl space-y-6">
      <fieldset disabled={saving || loadFailed} className={sectionClass}>
        <legend className="px-2 text-lg font-semibold">Blog listing</legend>
        <p className="text-sm text-slate-400">These fields appear on Insights and at the top of the article detail page.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm">Article title *<Input required maxLength={255} value={data.title || ""} onChange={e => set("title", e.target.value)} className={inputClass} /></label>
          <label className="text-sm">Page URL slug<Input maxLength={255} value={data.slug || ""} onChange={e => set("slug", e.target.value)} placeholder="Generated automatically if left blank" className={inputClass} /><p className="mt-2 text-xs text-slate-400">Detail page: /post/{data.slug || "your-article-slug"}/</p></label>
          <label className="text-sm">Category<select value={data.category_id || ""} onChange={e => set("category_id", e.target.value)} className={`mt-2 block w-full rounded-md border border-slate-600 bg-slate-900 p-2.5 ${data.category_id ? "text-slate-100" : "text-slate-500"}`}><option value="">Uncategorized</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><Link href="/dashboard/website/blogs/categories" target="_blank" className="mt-2 inline-block text-xs text-blue-400">Manage categories</Link></label>
          <label className="text-sm">Featured image<Input type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} className={inputClass} /><p className="mt-2 text-xs text-slate-400">Landscape image, up to 5 MB. Used on the listing and detail page.</p></label>
        </div>
        {shownImage && <img src={shownImage} alt="Featured image preview" className="max-h-60 w-full max-w-md rounded-xl object-cover" />}
        <label className="block text-sm">Short summary<Textarea maxLength={1000} value={data.excerpt || ""} onChange={e => set("excerpt", e.target.value)} className={inputClass} /><p className="mt-2 text-xs text-slate-400">Appears on the article card and below the detail-page title.</p></label>
      </fieldset>
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold">Blog detail page</h2>
        <p className="text-sm text-slate-400">Write the full article using the editor. Reading time and search metadata are generated automatically.</p>
        <BlogEditor value={data.content || ""} format={data.content_format || "markdown"} title={data.title || ""} excerpt={data.excerpt || ""} image={shownImage} onChange={content => setData(previous => ({ ...previous, content, content_format: "html" }))} />
      </div>
      <fieldset disabled={saving || loadFailed} className={sectionClass}>
        <legend className="px-2 text-lg font-semibold">Publishing</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="text-sm">Status *<select value={data.status || "draft"} onChange={e => set("status", e.target.value)} className="mt-2 block w-full rounded-md border border-slate-600 bg-slate-900 p-2.5"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
        </div>
        {data.status === "published" && <PublicationTiming mode={publishMode} onModeChange={setPublishMode} value={publishAt} onChange={setPublishAt} />}
        <p className="text-sm text-slate-400">Choose Published to show the article on /insights/ and its detail page. Draft and archived articles stay hidden.</p>
      </fieldset>
      <div className="flex gap-3"><Button disabled={saving || loadFailed}>{saving ? "Saving..." : data.status === "published" ? publishMode === "scheduled" ? "Schedule blog" : "Save and publish blog" : "Save blog post"}</Button><Link href="/dashboard/website/blogs"><Button type="button" variant="outline">Cancel</Button></Link></div>
    </form>}
  </>
}
