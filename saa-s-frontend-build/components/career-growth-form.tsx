"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { CheckCircle2, GraduationCap, Loader2, Send } from "lucide-react"
import { api, getErrorMessage } from "@/app/dashboard/services/api"

const inputClass = "mt-1.5 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-950 outline-none transition-all focus:border-[var(--accent-glow)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-glow)]/10"
const labelClass = "block text-sm font-semibold text-gray-800"

export function CareerGrowthForm() {
  const form = useRef<HTMLFormElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSubmitting(true); setError("")
    try {
      await api.post("/career-growth-registrations", Object.fromEntries(new FormData(event.currentTarget)))
      form.current?.reset()
      setSuccess(true)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="relative overflow-hidden bg-gray-50 pb-24 pt-32 text-gray-950 lg:pb-32 lg:pt-40">
    <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
    <div className="pointer-events-none absolute left-1/3 top-1/4 h-96 w-96 rounded-full bg-[var(--accent-glow)]/15 blur-[130px]" />

    <div className="relative mx-auto w-full max-w-[1400px] px-5 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur"><GraduationCap className="h-4 w-4" />Invest in your future</span>
        <h1 className="mt-6 text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">The Career <span className="text-[var(--accent-glow)]">Growth Course</span></h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty leading-relaxed text-gray-600 sm:text-lg">Build confidence, make strong impressions and navigate your career with professionalism and ease.</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl items-stretch gap-8 lg:grid-cols-[0.72fr_1.28fr]">
        <div className="relative min-h-[360px] overflow-hidden rounded-[120px_28px_120px_28px] border-8 border-white shadow-2xl lg:min-h-full">
          <Image src="/course/studying-laptop.png" alt="Student developing career skills through an online course" fill priority className="object-cover" sizes="(min-width:1024px) 35vw, 90vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#061c35]/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 p-8 text-white"><h2 className="text-2xl font-bold">Grow with confidence.</h2><p className="mt-2 text-sm text-white/80">Practical guidance for every stage of your career journey.</p></div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-900/10 sm:p-10">
          {success ? <div className="flex min-h-[520px] flex-col items-center justify-center text-center">
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-11 w-11 text-emerald-600" /></span>
            <h2 className="mt-6 text-3xl font-bold">Registration received!</h2>
            <p className="mt-3 max-w-md text-gray-600">Thank you for your interest. Our team will contact you with the next steps for your selected course.</p>
            <button type="button" onClick={() => setSuccess(false)} className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Register another person</button>
          </div> : <>
            <h2 className="text-3xl font-bold">Sign up today</h2>
            <p className="mt-2 text-gray-600">Complete the form and our team will help you get started.</p>
            <form ref={form} onSubmit={submit} className="mt-7 space-y-5">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
              <div className="grid gap-5 sm:grid-cols-2">
                <label className={labelClass}>First name <span className="text-[var(--accent-glow)]">*</span><input name="first_name" required className={inputClass} /></label>
                <label className={labelClass}>Last name <span className="text-[var(--accent-glow)]">*</span><input name="last_name" required className={inputClass} /></label>
                <label className={labelClass}>Email <span className="text-[var(--accent-glow)]">*</span><input name="email" type="email" required className={inputClass} /></label>
                <label className={labelClass}>Phone <span className="text-[var(--accent-glow)]">*</span><input name="phone" type="tel" required className={inputClass} /></label>
              </div>
              <label className={labelClass}>Current status <span className="text-[var(--accent-glow)]">*</span>
                <select name="current_status" required defaultValue="" className={inputClass}><option value="" disabled>Select your current status</option><option>Job Seeker</option><option>Employed</option><option>Student</option><option>Career Change</option><option>Other</option></select>
              </label>
              <label className={labelClass}>Which course are you interested in? <span className="text-[var(--accent-glow)]">*</span>
                <select name="course" required defaultValue="" className={inputClass}><option value="" disabled>Select a course</option><option>Complete Career Growth Course</option><option>Resume Building</option><option>Interview Preparation</option><option>Workplace Success &amp; Career Transitions</option></select>
              </label>
              <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting registration...</> : <>Submit registration<Send className="h-4 w-4" /></>}
              </button>
            </form>
          </>}
        </div>
      </div>
    </div>
  </section>
}
