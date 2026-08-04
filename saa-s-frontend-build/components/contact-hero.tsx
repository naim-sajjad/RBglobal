"use client"

import { motion } from "motion/react"

export function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-gray-100 pt-32 pb-20 text-gray-950 lg:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-white opacity-80 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[var(--accent-glow)] opacity-15 blur-[120px]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1600px] px-5 text-center lg:px-8">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-1.5 text-sm font-medium text-gray-700 shadow-sm backdrop-blur"
        >
          We&apos;re here to help
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl"
        >
          Let&apos;s Start a{" "}
          <span className="text-[var(--accent-glow)]">Conversation</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-gray-700 sm:text-lg"
        >
          Looking to hire top talent or find your next opportunity? Reach out and
          our team will connect with you within one business day.
        </motion.p>
      </div>
    </section>
  )
}
