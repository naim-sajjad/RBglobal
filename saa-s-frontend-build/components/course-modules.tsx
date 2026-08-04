"use client"

import { motion } from "motion/react"
import {
  FileText,
  MessagesSquare,
  CalendarCheck,
  DoorOpen,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { courseModules } from "@/lib/course"

const iconMap: Record<string, LucideIcon> = {
  FileText,
  MessagesSquare,
  CalendarCheck,
  DoorOpen,
  Users,
  Sparkles,
}

export function CourseModules() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1600px] gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8">
        {/* left intro — sticky on desktop */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="lg:sticky lg:top-28 lg:self-start"
        >
          <span className="text-sm font-semibold uppercase tracking-wider text-brand-light">
            What you&apos;ll learn
          </span>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The Career Growth Course
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            This course covers every stage of your career journey — from writing
            a standout resume and acing interviews to thriving in your first 30
            days and navigating career transitions with confidence.
          </p>
          <a
            href="/career-growth-form/"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-105"
          >
            Sign Up Today
          </a>
        </motion.div>

        {/* right module grid */}
        <div className="grid gap-5 sm:grid-cols-2">
          {courseModules.map((mod, i) => {
            const Icon = iconMap[mod.icon] ?? FileText
            return (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
                className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-brand-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {mod.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {mod.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
