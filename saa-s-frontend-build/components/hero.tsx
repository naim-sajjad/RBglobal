"use client"

import { motion } from "motion/react"
import { ArrowRight, Briefcase, Users } from "lucide-react"

export function Hero() {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center overflow-hidden bg-gradient-to-br from-white via-gray-50 to-gray-200 pt-28 text-gray-950"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/hero-logistics.png"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-gray-50/90 to-gray-200/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-100 via-transparent to-white/80" />
      </div>

      {/* Animated glow lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-[var(--accent-glow)] to-transparent"
            style={{ top: `${30 + i * 18}%` }}
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: "100%", opacity: [0, 0.8, 0] }}
            transition={{
              duration: 5 + i,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 1.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid w-full max-w-[1600px] gap-12 px-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl"
          >
            Connecting Talent
            <br />
            With{" "}
            <span className="bg-gradient-to-r from-[var(--accent-glow)] to-[var(--brand-light)] bg-clip-text text-transparent">
              Opportunity
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-gray-700 lg:text-lg"
          >
            We are a full service recruitment company specializing in industrial,
            warehousing and trucking positions — 100% Canadian owned and operated,
            servicing Toronto and the GTA.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-wrap gap-4"
          >
            <a
              href="/contact#contact-form"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3.5 text-sm font-semibold text-brand shadow-lg shadow-orange-500/25 transition-transform hover:scale-105"
            >
              <Users className="h-4 w-4" />
              Job Seekers
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="/contact#contact-form"
              className="group inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-7 py-3.5 text-sm font-semibold text-gray-900 backdrop-blur transition-colors hover:bg-white"
            >
              <Briefcase className="h-4 w-4" />
              Employers
            </a>
          </motion.div>
        </div>

        {/* Floating card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative hidden lg:block"
        >
          <motion.div
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="overflow-hidden rounded-3xl border border-gray-200 bg-white/80 p-2 backdrop-blur-xl shadow-2xl"
          >
            <video
              src="/home-hero-video.mp4"
              className="h-80 w-full rounded-2xl object-cover"
              autoPlay
              loop
              muted
              playsInline
              aria-label="R&B Services Plus recruitment video"
            />
            <div className="flex items-center justify-between px-4 py-4">
              <div>
                <div className="text-sm font-semibold text-gray-950">Ready to hire?</div>
                <div className="text-xs text-gray-600">Interview-ready candidates</div>
              </div>
              <a
                href="/contact#contact-form"
                className="rounded-full bg-[var(--accent-glow)] p-2.5 text-brand transition-transform hover:scale-110"
                aria-label="Get started"
              >
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
