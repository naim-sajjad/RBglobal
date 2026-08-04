"use client"

import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

export function CourseHero() {
  return (
    <section className="relative overflow-hidden bg-gray-100 pt-32 pb-20 text-gray-950 lg:pt-40">
      {/* glow accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-white opacity-80 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-[var(--accent-glow)]/15 blur-3xl" />
      </div>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-5 text-center lg:px-8">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 shadow-sm backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-glow)]" />
          Career Growth Course
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-4xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          From crafting the perfect resume to excelling in the workplace, this
          course prepares you for{" "}
          <span className="text-[var(--accent-glow)]">long term success</span>.
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-8 flex justify-center"
        >
          <a
            href="/career-growth-form/"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3.5 text-sm font-semibold text-brand shadow-lg shadow-orange-500/20 transition-transform hover:scale-105"
          >
            Sign Up Today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>

      {/* overlapping photo trio */}
      <div className="relative mx-auto mt-16 flex max-w-4xl items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, x: 40, rotate: 6 }}
          animate={{ opacity: 1, x: 0, rotate: -6 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hidden aspect-[3/4] w-44 overflow-hidden rounded-3xl border-4 border-white shadow-2xl shadow-gray-900/20 sm:block lg:w-56"
        >
          <img
            src="/course/resume-genius.avif"
            alt="Reviewing a professional resume"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="z-10 -mx-4 aspect-[4/3] w-72 overflow-hidden rounded-3xl border-4 border-white shadow-2xl shadow-gray-900/20 lg:w-96"
        >
          <img
            src="/course/interview.avif"
            alt="Job interview in a modern office"
            className="h-full w-full object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: -40, rotate: -6 }}
          animate={{ opacity: 1, x: 0, rotate: 6 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="hidden aspect-[3/4] w-44 overflow-hidden rounded-3xl border-4 border-white shadow-2xl shadow-gray-900/20 sm:block lg:w-56"
        >
          <img
            src="/course/online-course.avif"
            alt="Attending an online training call"
            className="h-full w-full object-cover"
          />
        </motion.div>
      </div>
    </section>
  )
}
