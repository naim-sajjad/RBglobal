import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, CheckCircle2, MapPin } from "lucide-react"
import { SiteHeader } from "@/components/web/Header"
import { SiteFooter } from "@/components/footer"
import type { JobPost } from "@/app/dashboard/services/jobService"
import { jobs as staticJobs } from "@/lib/jobs"
import { getJobApplyHref, staticJobToPost } from "@/lib/job-normalizers"

type JobPageProps = {
  params: Promise<{ slug: string }>
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")
const apiUrl = apiBaseUrl.endsWith("/api") ? apiBaseUrl : `${apiBaseUrl}/api`

async function fetchApiJob(slug: string): Promise<JobPost | null> {
  try {
    const response = await fetch(`${apiUrl}/job-posts/${slug}`, { cache: "no-store" })
    if (!response.ok) return null
    const result = await response.json()

    return result.data
  } catch {
    return null
  }
}

async function fetchJob(slug: string): Promise<JobPost | null> {
  const apiJob = await fetchApiJob(slug)
  if (apiJob) return apiJob

  return staticJobs.map(staticJobToPost).find((job) => job.slug === slug) ?? null
}

export async function generateMetadata({ params }: JobPageProps): Promise<Metadata> {
  const { slug } = await params
  const job = await fetchJob(slug)

  if (!job) return { title: "Job Not Found | R&B Services Plus Inc." }

  return {
    title: `${job.title} | R&B Services Plus Inc.`,
    description: [job.category, job.location, job.note].filter(Boolean).join(" | "),
  }
}

export default async function JobDetailPage({ params }: JobPageProps) {
  const { slug } = await params
  const job = await fetchJob(slug)
  if (!job) notFound()

  const applyHref = getJobApplyHref(job)

  return (
    <main className="bg-gray-100 text-gray-950">
      <SiteHeader />
      <article className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-white opacity-80 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-64 w-64 rounded-full bg-[var(--accent-glow)] opacity-15 blur-[120px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.45]" style={{ backgroundImage: "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />

        <div className="relative mx-auto max-w-4xl px-5 lg:px-8">
          <a href="/jobs" className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-primary/30 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to jobs
          </a>

          <header className="mt-10">
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-gray-600">
              <span className="rounded-full border border-gray-300 bg-white/70 px-3 py-1 text-brand">{job.category}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-[var(--accent-glow)]" />{job.location}</span>
            </div>
            <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">{job.title}</h1>
            {job.note ? <p className="mt-5 max-w-3xl text-pretty text-lg leading-relaxed text-gray-700">{job.note}</p> : null}
          </header>

          <div className="mt-10 overflow-hidden rounded-3xl border border-gray-200 bg-white p-2 shadow-2xl shadow-gray-900/10">
            <img src={job.image_url || "/placeholder.svg"} alt={`${job.title} role in ${job.location}`} className="aspect-[16/9] w-full rounded-2xl object-cover" />
          </div>

          <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-900/5 sm:p-8 lg:p-10">
            <h2 className="text-2xl font-bold text-gray-950">Job Details</h2>
            {job.bullets.length ? (
              <ul className="mt-6 space-y-3">
                {job.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-base leading-relaxed text-gray-700">
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-light" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 leading-relaxed text-gray-700">Apply for more details about this role.</p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={applyHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand-light">
                Apply Now
                <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/contact#contact-form" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-7 py-3.5 text-sm font-semibold text-gray-700 transition-colors hover:border-primary/30 hover:text-primary">
                Ask a Question
              </a>
            </div>
          </section>
        </div>
      </article>
      <SiteFooter />
    </main>
  )
}
