"use client"

import { useEffect, useState } from "react"
import { motion } from "motion/react"
import { ArrowUpRight, Clock } from "lucide-react"
import { getErrorMessage } from "@/app/dashboard/services/api"
import { getPublicBlogPosts } from "@/app/dashboard/services/blogService"
import { subscribeToNewsletter } from "@/app/dashboard/services/newsletterService"
import type { PublicBlogSummary } from "@/components/blog/blog-types"
import { mergeBlogSummaries, normalizeApiBlogSummary, normalizeStaticInsightSummary } from "@/lib/blog-normalizers"
import { insights } from "@/lib/insights"

const staticPosts = insights.map(normalizeStaticInsightSummary)

export function InsightsList() {
  const [posts, setPosts] = useState<PublicBlogSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [blogError, setBlogError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    getPublicBlogPosts({ per_page: 9, sort: "latest" })
      .then((response) => setPosts(mergeBlogSummaries(staticPosts, response.data.map(normalizeApiBlogSummary))))
      .catch(() => {
        setPosts(staticPosts)
        setBlogError("")
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    setSubmitting(true)
    setMessage("")
    setError("")

    try {
      const response = await subscribeToNewsletter({
        email: String(formData.get("email") ?? ""),
        source: "insights",
      })
      setMessage(response.message)
      form.reset()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  const featured = posts[0]
  const rest = posts.slice(1)

  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        {loading ? <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Loading insights...</div> : null}
        {blogError ? <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">{blogError}</div> : null}
        {!loading && !blogError && !posts.length ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">No insights are published yet.</div>
        ) : null}

        {featured ? (
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="group grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-brand/5 lg:grid-cols-2"
          >
            <div className="relative h-64 overflow-hidden lg:h-auto">
                <img src={featured.featuredImage || "/placeholder.svg"} alt={featured.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute left-5 top-5 rounded-full bg-[var(--accent-glow)] px-3 py-1 text-xs font-semibold text-brand">Featured</span>
            </div>
            <div className="flex flex-col justify-center bg-brand p-8 text-white lg:p-12">
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-white/60">
                <span>{featured.publishedAt ? new Date(featured.publishedAt).toLocaleDateString() : ""}</span>
                <span className="h-1 w-1 rounded-full bg-white/40" />
                <span>{featured.category?.name ?? "Insights"}</span>
              </div>
              <h2 className="mt-3 text-2xl font-bold lg:text-3xl">{featured.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-white/70">{featured.excerpt}</p>
              <a href={`/post/${featured.slug}`} className="group/btn mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent-glow)] px-6 py-3 text-sm font-semibold text-brand transition-transform hover:scale-105">
                Read Article
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </a>
            </div>
          </motion.article>
        ) : null}

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((post, i) => (
            <motion.article key={post.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.5, delay: i * 0.08 }} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/10">
              <div className="relative h-52 overflow-hidden">
                <img src={post.featuredImage || "/placeholder.svg"} alt={post.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <span className="absolute left-4 top-4 rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-brand backdrop-blur">{post.category?.name ?? "Insights"}</span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground">
                  <span>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : ""}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{post.readingTime}</span>
                </div>
                <h3 className="mt-3 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-brand">{post.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <a href={`/post/${post.slug}`} className="mt-5 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand">
                  Read more
                  <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div id="subscribe" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} className="mt-16 overflow-hidden rounded-3xl border border-border bg-secondary p-8 text-center lg:p-12">
          <h3 className="text-balance text-2xl font-bold text-foreground lg:text-3xl">Never miss an insight</h3>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">Subscribe to get the latest career advice, hiring trends, and job tips delivered straight to your inbox.</p>
          {message ? <p className="mx-auto mt-4 max-w-md rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">{message}</p> : null}
          {error ? <p className="mx-auto mt-4 max-w-md rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p> : null}
          <form onSubmit={handleNewsletterSubmit} className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
            <input name="email" type="email" required placeholder="Enter your email" className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none ring-brand/30 focus:ring-2" />
            <button type="submit" disabled={submitting} className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-105 disabled:pointer-events-none disabled:opacity-60">{submitting ? "Subscribing..." : "Subscribe"}</button>
          </form>
        </motion.div>
      </div>
    </section>
  )
}
