"use client"

import { motion } from "motion/react"
import { Star, Quote } from "lucide-react"

const reviews = [
  {
    quote:
      "Best in service, pay on time, flexible schedule, friendly atmosphere — and thanks to the team for taking care of and handling my account.",
    name: "GD Singh",
    source: "Google Reviews",
  },
  {
    quote:
      "I had a fast and effective experience with this agency. I was able to get a job thanks to them in no time at all.",
    name: "Adam Marr",
    source: "Google Reviews",
  },
  {
    quote:
      "I used the Career Growth Course and I was able to get a job interview after months of no responses. Highly recommend.",
    name: "Zayn",
    source: "Google Reviews",
  },
]

export function Testimonials() {
  return (
    <section id="reviews" className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-light">
            Reviews
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            The perfect customer experience
          </h2>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-xl hover:shadow-brand/5"
            >
              <Quote className="h-8 w-8 text-brand/20" />
              <blockquote className="mt-4 flex-1 text-pretty leading-relaxed text-foreground">
                {r.quote}
              </blockquote>
              <div className="mt-6 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-[var(--accent-glow)] text-[var(--accent-glow)]" />
                ))}
              </div>
              <figcaption className="mt-3 border-t border-border pt-4">
                <div className="font-semibold text-foreground">{r.name}</div>
                <div className="text-xs text-muted-foreground">{r.source}</div>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}
