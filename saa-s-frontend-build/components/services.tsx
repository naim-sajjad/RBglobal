"use client"

import { motion } from "motion/react"
import { ListChecks, MessagesSquare, Handshake, ArrowRight } from "lucide-react"

const services = [
  {
    icon: ListChecks,
    title: "Get Your Shortlist",
    desc: "We carry out pre-screening and provide you with interview-ready candidates who are a great fit for your position.",
  },
  {
    icon: MessagesSquare,
    title: "Conduct Interviews",
    desc: "Select your top picks. R&B Services Plus arranges face-to-face or telephonic interviews with the candidates.",
  },
  {
    icon: Handshake,
    title: "Hire Talent",
    desc: "Close the deal and add reliable new members to your team — with ongoing support from our team.",
  },
]

export function Services() {
  return (
    <section id="services" className="relative overflow-hidden bg-gray-100 py-20 text-gray-950 lg:py-28">
      <div className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(circle_at_1px_1px,rgb(209_213_219)_1px,transparent_0)] [background-size:32px_32px]" />

      <div className="relative mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--accent-glow)]">
              Explore Our Services
            </span>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight lg:text-5xl">
              A smarter way to build your team
            </h2>
          </div>
          <p className="max-w-xl text-pretty leading-relaxed text-gray-700">
            With our large network of employers and candidates, we help you find the
            best fit fast — while giving job seekers exposure to opportunities that
            advance their careers.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {services.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative rounded-2xl border border-gray-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-brand/30 hover:shadow-xl hover:shadow-brand/5"
            >
              <span className="absolute right-6 top-6 font-mono text-sm text-gray-300">
                0{i + 1}
              </span>
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-brand">
                <s.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <a
            href="/contact#contact-form"
            className="group inline-flex items-center gap-2 rounded-full bg-[var(--accent-glow)] px-8 py-4 text-sm font-semibold text-brand shadow-lg shadow-orange-500/25 transition-transform hover:scale-105"
          >
            Contact Us Today
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  )
}
