"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { CheckCircle2, FileText, Loader2, Send, Upload, X } from "lucide-react"
import { api, getErrorMessage } from "@/app/dashboard/services/api"
import { slugifyJob } from "@/lib/job-normalizers"

const inputClass =
  "mt-1.5 w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3.5 text-sm text-gray-950 outline-none transition-all placeholder:text-gray-400 focus:border-[var(--accent-glow)] focus:bg-white focus:ring-4 focus:ring-[var(--accent-glow)]/10"
const labelClass = "block text-sm font-semibold text-gray-800"

export const applicationJobs = [
  "AZ Driver | London, ON",
  "AZ Driver | Ajax, ON",
  "AZ Driver | Cambridge, ON",
  "AZ Driver | Whitby, ON",
  "Deep Reach Operator | Mississauga, ON",
  "General Labour | Mississauga, ON",
  "Experienced Accountant | Mississauga, ON",
] as const

const fields = [
  { name: "first_name", label: "First name", placeholder: "First name" },
  { name: "last_name", label: "Last name", placeholder: "Last name" },
  { name: "email", label: "Email", placeholder: "you@example.com", type: "email" },
  { name: "phone", label: "Phone", placeholder: "(123) 456-7890", type: "tel" },
  { name: "city", label: "City", placeholder: "City, Province" },
  { name: "availability", label: "Availability", placeholder: "e.g. Immediately" },
  { name: "immigration_status", label: "Immigration status", placeholder: "Your current status" },
  { name: "experience", label: "Experience", placeholder: "e.g. 5 years long haul" },
  { name: "referred_by", label: "Who referred you?", placeholder: "Name or source", optional: true },
] as const

export function ApplyForm({ initialJob = "" }: { initialJob?: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [resume, setResume] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [selectedJob, setSelectedJob] = useState(
    applicationJobs.includes(initialJob as (typeof applicationJobs)[number]) ? initialJob : "",
  )
  const licenseType = selectedJob.startsWith("AZ Driver")
    ? "AZ"
    : selectedJob === "Deep Reach Operator | Mississauga, ON" ? "FL" : null

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true); setError("")
    try {
      const payload = new FormData(event.currentTarget)
      payload.set("job_slug", slugifyJob(selectedJob))
      if (resume) payload.set("resume", resume)
      await api.post("/job-applications", payload)
      setSuccess(true)
      formRef.current?.reset()
      setResume(null)
      setSelectedJob("")
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="relative overflow-hidden bg-gray-50 pb-24 pt-32 text-gray-950 lg:pb-32 lg:pt-40">
    <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(to right, rgb(209 213 219) 1px, transparent 1px), linear-gradient(to bottom, rgb(209 213 219) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
    <div className="pointer-events-none absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-[var(--accent-glow)]/15 blur-[130px]" />

    <div className="relative mx-auto grid w-full max-w-[1600px] items-stretch gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16 lg:px-8">
      <div className="relative hidden min-h-[900px] overflow-hidden rounded-[180px_36px_180px_36px] border-[10px] border-white shadow-2xl lg:block">
        <Image src="/jobs/dock-aerial.png" alt="Aerial view of transport trucks at a loading facility" fill priority className="object-cover" sizes="(min-width: 1024px) 42vw, 0px" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061c35]/75 via-transparent to-transparent" />
        <div className="absolute bottom-0 p-10 text-white">
          <span className="rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">Build your driving career</span>
          <h2 className="mt-5 max-w-md text-4xl font-bold leading-tight">Your next opportunity starts here.</h2>
          <p className="mt-3 max-w-md text-white/80">Join a team connecting qualified drivers with trusted employers across Toronto and the GTA.</p>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-900/10 sm:p-10 lg:p-12">
        {success ? <div className="flex min-h-[700px] flex-col items-center justify-center text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50"><CheckCircle2 className="h-11 w-11 text-emerald-600" /></span>
          <h1 className="mt-6 text-3xl font-bold">Application submitted!</h1>
          <p className="mt-3 max-w-md text-gray-600">Thank you for applying. Our recruitment team will review your information and contact you if your experience matches an opportunity.</p>
          <button type="button" onClick={() => setSuccess(false)} className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Submit another application</button>
        </div> : <>
          <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-primary">Careers at R&amp;B Services Plus</span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Apply <span className="text-[var(--accent-glow)]">Now</span></h1>
          <p className="mt-3 max-w-2xl text-gray-600">Tell us about your experience and availability. Fields marked with * are required.</p>

          <form ref={formRef} onSubmit={submit} className="mt-8 space-y-6">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
            <label className={labelClass}>
              Which position are you applying for? <span className="text-[var(--accent-glow)]">*</span>
              <select name="job_title" required value={selectedJob} onChange={event => setSelectedJob(event.target.value)} className={inputClass}>
                <option value="" disabled>Select a position</option>
                {applicationJobs.map(job => <option key={job} value={job}>{job}</option>)}
              </select>
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              {fields.map(field => <label key={field.name} className={labelClass}>
                {field.label}{!field.optional && <span className="text-[var(--accent-glow)]"> *</span>}
                <input name={field.name} type={"type" in field ? field.type : "text"} required={!field.optional} placeholder={field.placeholder} className={inputClass} />
              </label>)}
              {licenseType && <label className={labelClass}>
                How old is your {licenseType} licence? <span className="text-[var(--accent-glow)]">*</span>
                <input name="license_age" required placeholder={`e.g. 3 years with ${licenseType}`} className={inputClass} />
              </label>}
            </div>

            <div>
              <span className={labelClass}>Resume upload</span>
              <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" hidden onChange={e => setResume(e.target.files?.[0] ?? null)} />
              {resume ? <div className="mt-2 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 p-4">
                <span className="flex min-w-0 items-center gap-3"><FileText className="h-5 w-5 shrink-0 text-primary" /><span className="truncate text-sm font-medium">{resume.name}</span></span>
                <button type="button" onClick={() => { setResume(null); if (fileRef.current) fileRef.current.value = "" }} aria-label="Remove resume" className="rounded-full p-1 text-gray-500 hover:bg-white hover:text-red-600"><X className="h-4 w-4" /></button>
              </div> : <button type="button" onClick={() => fileRef.current?.click()} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-primary bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5"><Upload className="h-4 w-4" />Upload file</button>}
              <p className="mt-2 text-xs text-gray-500">PDF, DOC or DOCX · Maximum 5 MB</p>
            </div>

            <label className={labelClass}>Message <span className="text-[var(--accent-glow)]">*</span>
              <textarea name="message" required rows={5} placeholder="Tell us about the type of work you are looking for..." className={`${inputClass} resize-none`} />
            </label>

            <button type="submit" disabled={submitting} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting application...</> : <>Submit application<Send className="h-4 w-4" /></>}
            </button>
          </form>
        </>}
      </div>
    </div>
  </section>
}
