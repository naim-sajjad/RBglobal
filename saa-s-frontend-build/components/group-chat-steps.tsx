"use client"

import { motion } from "motion/react"
import { UserPlus, BellRing, Send } from "lucide-react"

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Join the chat",
    desc: "Tap the button and join our WhatsApp community in seconds. No forms, no waiting.",
  },
  {
    icon: BellRing,
    step: "02",
    title: "Get notified",
    desc: "Receive real-time alerts the moment we post a new trucking, warehousing, or office role.",
  },
  {
    icon: Send,
    step: "03",
    title: "Apply fast",
    desc: "Reply directly to our recruiters and get fast-tracked ahead of the crowd.",
  },
]

export function GroupChatSteps() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-light">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Never miss an opportunity again
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Our group chat is the fastest way to hear about openings before they
            are filled. Here is how to get started.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-brand-light/40 hover:shadow-xl hover:shadow-brand/10"
            >
              <span className="absolute right-5 top-4 text-5xl font-bold text-muted/60">
                {s.step}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-brand-foreground transition-transform group-hover:scale-110">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-14 flex flex-col items-center justify-between gap-6 rounded-3xl bg-brand p-8 text-center sm:flex-row sm:text-left lg:p-10"
        >
          <div>
            <h3 className="text-2xl font-bold text-white">Ready to join?</h3>
            <p className="mt-1 text-white/70">
              It is free, and you can leave anytime.
            </p>
          </div>
          <a
            href="https://linktr.ee/randbservicesplus?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnByiGXkUuB7NwWb-pMin23uTWUT8gxnmKupPOTW_M8DomaPsRKFVyqPqrsJg_aem_xjHmF3x4Rf1Oz7sxwJwNQA"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[var(--accent-glow)] px-7 py-3.5 font-semibold text-brand shadow-lg shadow-orange-500/25 transition-transform hover:scale-105"
          >
            Join our group chat
          </a>
        </motion.div>
      </div>
    </section>
  )
}
