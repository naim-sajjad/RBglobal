"use client"

import { motion } from "motion/react"
import { Calculator, Boxes, Truck, HardHat, Cpu } from "lucide-react"

const industries = [
  { icon: Calculator, name: "Office & Accounting", desc: "Finance, admin and clerical professionals ready to contribute." },
  { icon: Boxes, name: "Industrial & Warehousing", desc: "Reliable hands for production, picking, packing and shipping." },
  { icon: Truck, name: "Trucking", desc: "Licensed drivers and logistics staff that keep freight moving." },
  { icon: HardHat, name: "General Labour", desc: "Hard-working, dependable labour matched to your shift needs." },
  { icon: Cpu, name: "Information Technology", desc: "Technical talent to support and scale your operations." },
]

export function Industries() {
  return (
    <section className="bg-background py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-light">
            Industries
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            We staff the roles that keep business moving
          </h2>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-brand-foreground transition-transform group-hover:scale-110">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand/5 transition-transform group-hover:scale-150" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
