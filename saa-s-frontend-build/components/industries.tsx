"use client"

import { motion } from "motion/react"
import { Calculator, Boxes, Truck, HardHat, Cpu, UserCog } from "lucide-react"

const industries = [
  { icon: Calculator, name: "Office & Accounting", desc: "Finance, admin and clerical professionals ready to contribute." },
  { icon: Boxes, name: "Industrial & Warehousing", desc: "Reliable hands for production, picking, packing and shipping." },
  { icon: Truck, name: "Trucking", desc: "Licensed drivers and logistics staff that keep freight moving." },
  { icon: HardHat, name: "General Labour", desc: "Hard-working, dependable labour matched to your shift needs." },
  { icon: Cpu, name: "Information Technology", desc: "Technical talent to support and scale your operations." },
  { icon: UserCog, name: "Customized Roles", desc: "Tailored staffing solutions built around your unique hiring needs." },
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
            We Staff the Roles That Keep Business Moving
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {industries.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative flex items-start gap-3.5 overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground transition-transform group-hover:scale-110">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold leading-snug text-foreground">{item.name}</h3>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
