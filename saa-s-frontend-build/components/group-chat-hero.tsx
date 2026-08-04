"use client"

import { motion } from "motion/react"
import { MessageCircle, Bell, Zap, ArrowRight } from "lucide-react"

const perks = [
  { icon: Bell, label: "Instant job alerts" },
  { icon: Zap, label: "First to apply" },
  { icon: MessageCircle, label: "Direct line to recruiters" },
]

export function GroupChatHero() {
  return (
    <section className="relative overflow-hidden bg-gray-100 pt-32 pb-20 text-gray-950 lg:pt-40 lg:pb-28">
      {/* glow accents */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-white opacity-80 blur-3xl animate-glow" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[var(--accent-glow)]/15 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative order-2 lg:order-1"
        >
          <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-gray-900/20">
            <img
              src="/group-chat/truck-sunset.png"
              alt="A semi truck driving on the highway at sunset"
              className="h-[340px] w-full object-cover sm:h-[460px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/50 to-transparent" />
          </div>

          {/* floating notification card */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute -bottom-6 left-6 flex items-center gap-3 rounded-2xl bg-background p-4 shadow-xl"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--accent-glow)]/15 text-[var(--accent-glow)]">
              <Bell className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">New AZ Driver role</p>
              <p className="text-xs text-muted-foreground">Posted 2 min ago · Mississauga</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="order-1 lg:order-2"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-gray-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-glow)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--accent-glow)]" />
            </span>
            Live job updates
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-bold leading-tight tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
            Get the latest{" "}
            <span className="text-[var(--accent-glow)]">job updates</span>
          </h1>

          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-gray-700">
            Join our group chat to stay updated on the latest job openings we are
            seeking to fill, ensuring you never miss an opportunity again.
          </p>

          <ul className="mt-8 flex flex-wrap gap-3">
            {perks.map((perk, i) => (
              <motion.li
                key={perk.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white/70 px-4 py-2 text-sm text-gray-700 shadow-sm"
              >
                <perk.icon className="h-4 w-4 text-[var(--accent-glow)]" />
                {perk.label}
              </motion.li>
            ))}
          </ul>

          <motion.a
            href="https://linktr.ee/randbservicesplus?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnByiGXkUuB7NwWb-pMin23uTWUT8gxnmKupPOTW_M8DomaPsRKFVyqPqrsJg_aem_xjHmF3x4Rf1Oz7sxwJwNQA"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3.5 text-base font-semibold text-brand shadow-lg shadow-orange-500/25"
          >
            Join our group chat
            <ArrowRight className="h-5 w-5" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}
