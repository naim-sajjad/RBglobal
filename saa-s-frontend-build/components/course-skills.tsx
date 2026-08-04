"use client"

import { motion } from "motion/react"
import { CheckCircle2 } from "lucide-react"

const highlights = [
  "Craft a standout resume and ace interviews",
  "Excel in your first 30 days on the job",
  "Navigate career transitions with professionalism",
]

export function CourseSkills() {
  return (
    <section className="bg-secondary py-20 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1600px] items-center gap-12 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl shadow-2xl"
        >
          <img
            src="/course/studying-laptop.png"
            alt="Student taking notes during an online lesson"
            className="aspect-[4/3] h-full w-full object-cover"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Build the Skills Employers Notice
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            Building a successful career takes more than just landing the job —
            it&apos;s about thriving at every stage. This course guides you
            through the entire journey, and each module is designed to give you
            the tools, strategies, and confidence to grow and succeed in your
            career.
          </p>

          <ul className="mt-7 flex flex-col gap-3">
            {highlights.map((h, i) => (
              <motion.li
                key={h}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                className="flex items-start gap-3 text-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span className="leading-relaxed">{h}</span>
              </motion.li>
            ))}
          </ul>

          <a
            href="/career-growth-form/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/20 transition-transform hover:scale-105"
          >
            Sign Up Today
          </a>
        </motion.div>
      </div>
    </section>
  )
}
