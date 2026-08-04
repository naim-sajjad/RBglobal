"use client"

import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

export function Insights() {
  return (
    <section id="insights" className="bg-background py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-light">
            Insights
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Stay ahead with expert knowledge
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            From resume building to essential interview tips, we share the tools and
            insights you need to stand out and land your dream job.
          </p>
        </div>

        <motion.article
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto mt-14 grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-brand/5 lg:grid-cols-2"
        >
          <div className="relative h-64 overflow-hidden lg:h-auto">
            <img
              src="/insight-toronto.png"
              alt="Toronto skyline at sunset over Lake Ontario"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            />
          </div>
          <div className="flex flex-col justify-center bg-brand p-8 text-white lg:p-12">
            <span className="text-xs font-medium uppercase tracking-wide text-white/60">
              May 28, 2025 · Career Growth
            </span>
            <h3 className="mt-3 text-2xl font-bold lg:text-3xl">
              Professionally Planning for Your Future
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              In today&apos;s fast-paced and ever-evolving professional landscape, having
              a clear plan for your career trajectory is more important than ever. Here
              is how to map out the next steps with confidence.
            </p>
            <a
              href="/post/professionally-planning-for-your-future"
              className="group mt-6 inline-flex w-fit items-center gap-2 rounded-full bg-[var(--accent-glow)] px-6 py-3 text-sm font-semibold text-brand transition-transform hover:scale-105"
            >
              Read Article
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>
        </motion.article>
      </div>
    </section>
  )
}
