"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react"
import { getErrorMessage } from "@/app/dashboard/services/api"
import { submitContactForm, type ContactRole } from "@/app/dashboard/services/contactService"

const contactDetails = [
  { icon: Mail, label: "Email", value: "info@randbservicesplus.ca", href: "mailto:info@randbservicesplus.ca" },
  { icon: Phone, label: "Phone", value: "437-424-3615", href: "tel:+14374243615" },
  { icon: MapPin, label: "Office", value: "25 Watline Ave, Mississauga, ON L4Z 2Z1", href: "#" },
]

const inputClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20"

const labelClass = "mb-1.5 block text-sm font-medium text-foreground"

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [role, setRole] = useState<ContactRole | "">("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return

    const form = e.currentTarget
    const formData = new FormData(form)
    setSubmitting(true)
    setError("")

    try {
      await submitContactForm({
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        location: String(formData.get("location") ?? ""),
        role: String(formData.get("role") ?? "") as ContactRole,
        message: String(formData.get("message") ?? ""),
      })
      form.reset()
      setRole("")
      setSubmitted(true)
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="contact-form" className="relative overflow-hidden bg-background py-20 lg:py-28">
      {/* decorative glow */}
      <div className="pointer-events-none absolute -right-32 top-10 h-96 w-96 rounded-full bg-brand/5 blur-3xl" />

      <div className="mx-auto grid w-full max-w-[1600px] items-stretch gap-10 px-5 lg:grid-cols-2 lg:gap-16 lg:px-8">
        {/* Left: image + contact details */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex flex-col gap-8"
        >
          <div className="relative overflow-hidden rounded-[2.5rem] rounded-tr-[6rem] shadow-2xl shadow-brand/20">
            <img
              src="/contact/handshake.png"
              alt="Two professionals shaking hands in a modern office"
              className="h-72 w-full object-cover sm:h-96 lg:h-[28rem]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand/40 via-transparent to-transparent" />
          </div>

          <div className="grid gap-4">
            {contactDetails.map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-lg"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground">
                  <item.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </span>
                  <span className="block truncate text-sm font-semibold text-foreground group-hover:text-brand">
                    {item.value}
                  </span>
                </span>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Right: form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-[2rem] border border-border bg-card p-6 shadow-xl shadow-brand/5 sm:p-8 lg:p-10"
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex h-full flex-col items-center justify-center py-16 text-center"
              >
                <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <CheckCircle2 className="h-9 w-9" />
                </span>
                <h3 className="text-2xl font-bold text-foreground">Message sent!</h3>
                <p className="mt-2 max-w-sm text-pretty text-sm text-muted-foreground">
                  Thanks for reaching out to R&B Services Plus. Our team will get back to you within one business day.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-6 rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-5"
              >
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">Send us a message</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Whether you&apos;re hiring or job hunting, we&apos;d love to hear from you.
                  </p>
                </div>

                {error ? (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="firstName" className={labelClass}>
                      First name <span className="text-[var(--accent-glow)]">*</span>
                    </label>
                    <input id="firstName" name="firstName" required placeholder="First name" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="lastName" className={labelClass}>
                      Last name <span className="text-[var(--accent-glow)]">*</span>
                    </label>
                    <input id="lastName" name="lastName" required placeholder="Last name" className={inputClass} />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email <span className="text-[var(--accent-glow)]">*</span>
                    </label>
                    <input id="email" name="email" type="email" required placeholder="you@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone <span className="text-[var(--accent-glow)]">*</span>
                    </label>
                    <input id="phone" name="phone" type="tel" required placeholder="(123) 456-7890" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className={labelClass}>
                    Location <span className="text-[var(--accent-glow)]">*</span>
                  </label>
                  <input id="location" name="location" required placeholder="City, Province" className={inputClass} />
                </div>

                <div>
                  <span className={labelClass}>
                    Are you a job seeker or employer? <span className="text-[var(--accent-glow)]">*</span>
                  </span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { key: "employer", label: "Employer" },
                      { key: "seeker", label: "Job Seeker" },
                    ].map((opt) => (
                      <label
                        key={opt.key}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                          role === opt.key
                            ? "border-brand bg-brand/5 text-brand"
                            : "border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        <input
                          type="radio"
                          name="role"
                          value={opt.key}
                          required
                          checked={role === opt.key}
                          onChange={() => setRole(opt.key as ContactRole)}
                          className="h-4 w-4 accent-[var(--brand)]"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className={labelClass}>
                    Message <span className="text-[var(--accent-glow)]">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    placeholder="How can we help?"
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-7 py-3.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/25 transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit"}
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
