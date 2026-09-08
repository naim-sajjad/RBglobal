"use client"

import { motion } from "motion/react"
import { ArrowRight } from "lucide-react"

export function EmployersCta() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-brand lg:grid lg:grid-cols-[1.15fr_0.85fr]"
        >
          <div className="px-8 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/70">
              Next step
            </span>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl">
              Ready to staff your next role?
            </h2>
            <p className="mt-4 max-w-xl text-pretty leading-relaxed text-white/75">
              Tell us what you need — role, location, start date and shift. Our
              recruiters will follow up within one business day with a plan to
              fill it.
            </p>
            <a
              href="/contact/?role=employer#contact-form"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-black/20 transition-transform hover:scale-105"
            >
              Contact us
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
          <div className="relative min-h-56">
            <img
              src="/jobs/dock-aerial.png"
              alt="Transport trucks at a loading facility in the GTA"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-brand/20" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
