"use client"

import { motion } from "motion/react"
import { ListChecks, MessagesSquare, Handshake, ShieldCheck, MapPin, Headphones } from "lucide-react"

const steps = [
  {
    icon: ListChecks,
    title: "Share the role",
    desc: "Tell us the position, site, shift and must-haves. We confirm the profile before we start recruiting.",
  },
  {
    icon: MessagesSquare,
    title: "Receive a shortlist",
    desc: "We pre-screen for experience, availability and fit, then send interview-ready candidates — not a pile of unvetted résumés.",
  },
  {
    icon: Handshake,
    title: "Interview and hire",
    desc: "You choose who to meet. We coordinate interviews, support the offer, and stay available after the start date.",
  },
]

const reasons = [
  { icon: ShieldCheck, title: "Pre-screened talent", desc: "Candidates are qualified before they reach your calendar." },
  { icon: MapPin, title: "Toronto & GTA coverage", desc: "Local recruiting for warehouses, yards, plants and offices." },
  { icon: Headphones, title: "A recruiter in your corner", desc: "One team that understands industrial hiring and follows through." },
]

export function HiringProcess() {
  return (
    <section className="relative overflow-hidden bg-gray-100 py-20 text-gray-950 lg:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(circle_at_1px_1px,rgb(209_213_219)_1px,transparent_0)] [background-size:32px_32px]" />

      <div className="relative mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-glow)]">
              How hiring works
            </span>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight lg:text-5xl">
              A clearer path from opening to start date
            </h2>
          </div>
          <p className="max-w-xl text-pretty leading-relaxed text-gray-700">
            You stay focused on operations. We handle sourcing, screening and
            coordination so the people you meet are ready for the work.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
            >
              <span className="absolute right-6 top-6 font-mono text-sm text-gray-300">0{i + 1}</span>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-white">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {reasons.map((item) => (
            <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white/80 p-5">
              <item.icon className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent-glow)]" />
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
