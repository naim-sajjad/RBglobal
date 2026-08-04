import type { SVGProps } from "react"
import { ArrowLeft, ArrowUpRight, Clock, Link as LinkIcon, Share2 } from "lucide-react"
import { SiteHeader } from "@/components/web/Header"
import { SiteFooter } from "@/components/footer"
import type { PublicBlogPost } from "./blog-types"

type BlogDetailPageProps = {
  post: PublicBlogPost
  currentUrl?: string
}

const defaultCta = {
  title: "Ready for Your Next Step?",
  description:
    "Whether you are exploring new work, preparing for interviews, or planning a career move, R&B Services Plus can help connect you with opportunities that match your goals.",
  buttonLabel: "Apply now",
  buttonUrl: "/contact#contact-form",
}

function IconLinkedin(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18.34V9.99H5.67v8.35h2.67Zm-1.33-9.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Zm11.33 9.5v-4.83c0-2.58-1.38-3.78-3.22-3.78-1.48 0-2.15.82-2.52 1.39v-1.19h-2.67c.04.76 0 8.35 0 8.35h2.67v-4.66c0-.24.02-.48.09-.65.19-.48.63-.97 1.36-.97.96 0 1.34.73 1.34 1.8v4.48h2.66Z" />
    </svg>
  )
}

function formatDate(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
}

function renderInline(text: string) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean)

  return parts.map((part, index) => {
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const href = link[2].startsWith("http") || link[2].startsWith("/") ? link[2] : "#"
      return (
        <a key={`${part}-${index}`} href={href} className="font-semibold text-brand underline-offset-4 hover:underline">
          {link[1]}
        </a>
      )
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={`${part}-${index}`}>{part.slice(1, -1)}</em>
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function renderContent(content: string) {
  const blocks = content.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean)

  return blocks.map((block, index) => {
    if (block.startsWith("### ")) {
      return <h3 key={index} className="text-base font-bold text-gray-950">{block.replace(/^###\s+/, "")}</h3>
    }

    if (block.startsWith("## ")) {
      return <h2 key={index} className="text-lg font-bold text-gray-950">{block.replace(/^##\s+/, "")}</h2>
    }

    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean)
    if (lines.length && lines.every((line) => /^(\d+\.|-|\*)\s+/.test(line))) {
      const ordered = lines.every((line) => /^\d+\.\s+/.test(line))
      const items = lines.map((line) => line.replace(/^(\d+\.|-|\*)\s+/, ""))
      const ListTag = ordered ? "ol" : "ul"

      return (
        <ListTag key={index} className={`${ordered ? "list-decimal" : "list-disc"} space-y-2 pl-5`}>
          {items.map((item) => <li key={item}>{renderInline(item)}</li>)}
        </ListTag>
      )
    }

    if (block.startsWith("> ")) {
      return <blockquote key={index} className="border-l-4 border-brand/30 pl-5 font-medium text-gray-800">{renderInline(block.replace(/^>\s+/, ""))}</blockquote>
    }

    return <p key={index} className="whitespace-pre-wrap">{renderInline(block)}</p>
  })
}

export function BlogDetailPage({ post, currentUrl }: BlogDetailPageProps) {
  const cta = {
    title: post.cta?.title || defaultCta.title,
    description: post.cta?.description || defaultCta.description,
    buttonLabel: post.cta?.buttonLabel || defaultCta.buttonLabel,
    buttonUrl: post.cta?.buttonUrl || defaultCta.buttonUrl,
  }
  const shareUrl = currentUrl ?? `/post/${post.slug}`
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`

  return (
    <main className="bg-gray-100 text-gray-950">
      <SiteHeader />
      <article className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-white opacity-80 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-64 w-64 rounded-full bg-[var(--accent-glow)] opacity-15 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.45]" style={{ backgroundImage: "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative mx-auto max-w-4xl px-5 lg:px-8">
          <a href="/insights" className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-primary/30 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to insights
          </a>

          <header className="mt-10">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
              <span className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-brand">{post.category?.name ?? "Insights"}</span>
              <span>{formatDate(post.publishedAt)}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{post.readingTime}</span>
            </div>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">{post.title}</h1>
            <p className="mt-5 max-w-3xl text-pretty text-lg leading-relaxed text-gray-700">{post.excerpt}</p>
          </header>

          {post.featuredImage ? (
            <div className="mt-10 overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-900/10">
              <img src={post.featuredImage} alt={post.title} className="aspect-[16/9] w-full rounded-2xl object-cover" />
            </div>
          ) : null}

          <div className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5 sm:p-8 lg:p-10">
            <div className="space-y-8 text-base leading-relaxed text-gray-700">
              {renderContent(post.content || post.excerpt || "")}
            </div>
          </div>

          <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5 sm:p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-gray-950">{cta.title}</h2>
            <p className="mt-4 leading-relaxed text-gray-700">{cta.description}</p>
            <div className="mt-8 flex justify-center">
              <a href={cta.buttonUrl} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3.5 text-sm font-semibold text-brand shadow-lg shadow-orange-500/20 transition-transform hover:scale-105">{cta.buttonLabel}<ArrowUpRight className="h-4 w-4" /></a>
            </div>
          </section>

          <div className="mt-12 flex items-center gap-3 border-t border-gray-300 pt-6">
            <span className="text-sm font-semibold text-gray-600">Share</span>
            <a href={shareUrl} aria-label="Share" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:border-[var(--accent-glow)] hover:bg-[var(--accent-glow)] hover:text-brand"><Share2 className="h-4 w-4" /></a>
            <a href={linkedInHref} aria-label="LinkedIn" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:border-[var(--accent-glow)] hover:bg-[var(--accent-glow)] hover:text-brand"><IconLinkedin className="h-4 w-4" /></a>
            <a href={shareUrl} aria-label="Copy link" className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:border-[var(--accent-glow)] hover:bg-[var(--accent-glow)] hover:text-brand"><LinkIcon className="h-4 w-4" /></a>
          </div>

          {post.relatedPosts?.length ? (
            <section className="mt-16">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-950">Recent Posts</h2>
                <a href="/insights" className="text-sm font-semibold text-brand hover:text-primary">See all</a>
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                {post.relatedPosts.map((item) => (
                  <a key={item.slug} href={`/post/${item.slug}`} className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-900/10">
                    <img src={item.featuredImage || "/placeholder.svg"} alt={item.title} className="h-36 w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{item.category?.name ?? "Insights"}</p>
                      <h3 className="mt-2 text-sm font-bold leading-snug text-gray-950 transition-colors group-hover:text-brand">{item.title}</h3>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
