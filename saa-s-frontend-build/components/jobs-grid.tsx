"use client"

import { useMemo, useState } from "react"
import { useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { MapPin, ArrowRight, CheckCircle2 } from "lucide-react"
import { jobs as allJobs } from "@/lib/jobs"
import { getPublicJobs, type JobPost } from "@/app/dashboard/services/jobService"
import { getJobApplyHref, mergeJobsWithApiPriority, staticJobToPost } from "@/lib/job-normalizers"

const categories = ["All", "Trucking", "Warehousing", "General Labour", "Office & Accounting"]

const staticJobs = allJobs.map(staticJobToPost)

export function JobsGrid() {
  const [active, setActive] = useState("All")
  const [jobs, setJobs] = useState<JobPost[]>(staticJobs)

  useEffect(() => {
    getPublicJobs({ per_page: 100, sort: "latest" })
      .then((response) => setJobs(mergeJobsWithApiPriority(response.data, staticJobs)))
      .catch(() => setJobs(staticJobs))
  }, [])

  const filtered = useMemo(
    () => (active === "All" ? jobs : jobs.filter((j) => j.category === active)),
    [active, jobs],
  )

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        {/* filters */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2.5">
          {categories.map((cat) => {
            const isActive = cat === active
            return (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "text-brand-foreground" : "text-muted-foreground hover:text-brand"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="job-filter-pill"
                    className="absolute inset-0 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            )
          })}
        </div>

        {/* grid */}
        <motion.div layout className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((job, i) => (
              <motion.article
                key={job.slug}
                layout
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/10"
              >
                <a href={`/jobs/${job.slug}`} className="relative block aspect-[16/10] overflow-hidden">
                  <img
                    src={job.image_url || "/placeholder.svg"}
                    alt={`${job.title} role in ${job.location}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-brand/90 px-3 py-1 text-xs font-semibold text-brand-foreground backdrop-blur">
                    {job.category}
                  </span>
                </a>

                <div className="flex flex-1 flex-col p-6">
                  <a href={`/jobs/${job.slug}`} className="min-h-14 text-lg font-bold leading-snug text-brand transition-colors hover:text-brand-light">{job.title}</a>
                  <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <MapPin className="h-4 w-4 text-[var(--accent-glow)]" />
                    {job.location}
                  </p>

                  <ul className="mt-4 flex-1 space-y-2">
                    {job.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-foreground/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-light" />
                        <span>{b}</span>
                      </li>
                    ))}
                    {job.note && (
                      <li className="text-sm italic text-muted-foreground">{job.note}</li>
                    )}
                  </ul>

                  <a
                    href={getJobApplyHref(job)}
                    className="group/btn mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-all hover:bg-brand-light"
                  >
                    Apply Now
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </a>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 overflow-hidden rounded-3xl bg-brand px-6 py-12 text-center lg:px-16"
        >
          <h2 className="text-balance text-2xl font-bold text-white sm:text-3xl">
            {"Don't see the right role?"}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-white/70">
            Send us your resume and our recruiters will match you with new
            opportunities as they open up.
          </p>
          <a
            href="/contact#contact-form"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3 text-sm font-semibold text-brand shadow-lg transition-transform hover:scale-105"
          >
            Submit Your Resume
            <ArrowRight className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}
