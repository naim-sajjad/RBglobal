"use client"

import { motion } from "motion/react"
import { Briefcase, Clock, RefreshCw, UserSearch, Calculator, Boxes, Truck, HardHat, Cpu, UserCog } from "lucide-react"

const solutions = [
  {
    icon: Clock,
    title: "Temporary & on-demand coverage",
    desc: "Fill absences, seasonal peaks and extra shifts without slowing operations. We keep a ready bench of screened workers.",
  },
  {
    icon: RefreshCw,
    title: "Temp-to-permanent",
    desc: "Try talent on the job first. Convert the right people to your payroll when they have proven they are a fit.",
  },
  {
    icon: Briefcase,
    title: "Direct hire",
    desc: "Need a lasting addition to the team? We source, screen and present interview-ready candidates for permanent roles.",
  },
  {
    icon: UserSearch,
    title: "Custom workforce programs",
    desc: "Multi-site, high-volume or specialized hiring? We build a staffing plan around your shifts, sites and compliance needs.",
  },
]

const roles = [
  { icon: Truck, name: "Trucking & logistics", desc: "AZ drivers and warehouse-to-road support that keeps freight moving." },
  { icon: Boxes, name: "Industrial & warehousing", desc: "Pick, pack, ship, forklift and production staff matched to your floor." },
  { icon: HardHat, name: "General labour", desc: "Dependable labour for day, afternoon and night shifts." },
  { icon: Calculator, name: "Office & accounting", desc: "Admin, clerical and finance professionals ready to contribute." },
  { icon: Cpu, name: "Information technology", desc: "Technical talent to support and scale your operations." },
  { icon: UserCog, name: "Customized roles", desc: "If the position is unique, we recruit to the requirements you set." },
]

export function StaffingSolutions() {
  return (
    <section id="solutions" className="scroll-mt-28 bg-background py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-light">
            How we staff
          </span>
          <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            Staffing solutions that match how you hire
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
            Whether you need coverage this week or a long-term hire, we place people
            who are screened for the work — not just a résumé.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {solutions.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/5"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-white">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20">
          <h3 className="text-center text-2xl font-extrabold tracking-tight text-foreground lg:text-3xl">
            Roles we fill across the GTA
          </h3>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-card p-4"
              >
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-base font-bold leading-snug text-foreground">{item.name}</h4>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
