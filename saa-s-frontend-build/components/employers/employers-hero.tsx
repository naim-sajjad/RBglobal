"use client"

import { motion } from "motion/react"
import { ArrowDown, ArrowRight } from "lucide-react"

export function EmployersHero() {
  return (
    <section className="relative overflow-hidden bg-gray-100 pt-32 pb-20 text-gray-950 lg:pt-40 lg:pb-28">
      <div className="absolute inset-0">
        <img
          src="/hero-logistics.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-100/90 to-gray-100/70" />
      </div>
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-white opacity-80 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[var(--accent-glow)] opacity-15 blur-[120px]" />

      <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-12 px-5 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-700 shadow-sm backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-glow)]" />
            Staffing services for employers
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Build your team with{" "}
            <span className="text-[var(--accent-glow)]">interview-ready</span> talent
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-gray-700 sm:text-lg"
          >
            R&amp;B Services Plus is a 100% Canadian-owned recruitment partner for
            industrial, warehousing, trucking and office roles across Toronto and
            the GTA. We pre-screen candidates so you spend time with people who
            can actually do the job.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <a
              href="#solutions"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/30 transition-transform hover:scale-105"
            >
              Explore staffing solutions
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href="/contact/?role=employer#contact-form"
              className="group inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/80 px-7 py-3.5 text-sm font-semibold text-gray-900 backdrop-blur transition-colors hover:bg-white"
            >
              Contact our team
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="relative overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] border-8 border-white shadow-2xl shadow-gray-900/10"
        >
          <img
            src="/contact/handshake.png"
            alt="Professionals shaking hands after a successful hire"
            className="h-72 w-full object-cover sm:h-96 lg:h-[28rem]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061c35]/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 p-8 text-white">
            <p className="text-sm font-medium text-white/80">Your HR partner</p>
            <p className="mt-1 max-w-sm text-2xl font-bold leading-tight">
              Shortlists you can interview with confidence.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
