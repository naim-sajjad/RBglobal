"use client"

import { useState } from "react"
import { motion } from "motion/react"
import { Mail, Phone, MapPin } from "lucide-react"
import { Logo } from "./logo"
import { getErrorMessage } from "@/app/dashboard/services/api"
import { subscribeToNewsletter, type NewsletterRole } from "@/app/dashboard/services/newsletterService"

function IconLinktree(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M10.35 2h3.3v7.06l4.97-4.97 2.34 2.33-4.98 4.98H23v3.3h-7.02l4.98 4.98-2.34 2.33-4.97-4.97V24h-3.3v-6.96l-4.97 4.97-2.34-2.33 4.98-4.98H1v-3.3h7.02L3.04 6.42l2.34-2.33 4.97 4.97V2Z" />
    </svg>
  )
}
function IconWhatsapp(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.52 3.48A11.82 11.82 0 0 0 12.1 0C5.56 0 .24 5.31.24 11.84c0 2.08.55 4.12 1.59 5.91L.14 24l6.39-1.68a11.9 11.9 0 0 0 5.56 1.42h.01c6.53 0 11.85-5.31 11.85-11.84a11.78 11.78 0 0 0-3.43-8.42Zm-8.42 18.25h-.01a9.86 9.86 0 0 1-5.02-1.37l-.36-.21-3.79.99 1.01-3.69-.24-.38a9.8 9.8 0 0 1-1.5-5.23c0-5.44 4.44-9.87 9.9-9.87a9.84 9.84 0 0 1 6.99 2.9 9.8 9.8 0 0 1 2.89 7.03c0 5.44-4.44 9.83-9.87 9.83Zm5.42-7.37c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46a8.9 8.9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.11 3.22 5.11 4.51.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  )
}
function IconInstagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
    </svg>
  )
}
function IconFacebook(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  )
}
function IconLinkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18.34V9.99H5.67v8.35h2.67Zm-1.33-9.5a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1Zm11.33 9.5v-4.83c0-2.58-1.38-3.78-3.22-3.78-1.48 0-2.15.82-2.52 1.39v-1.19h-2.67c.04.76 0 8.35 0 8.35h2.67v-4.66c0-.24.02-.48.09-.65.19-.48.63-.97 1.36-.97.96 0 1.34.73 1.34 1.8v4.48h2.66Z" />
    </svg>
  )
}
function IconTiktok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 2c.3 2.58 1.74 4.12 4.22 4.28v3.08a7.18 7.18 0 0 1-4.16-1.26v6.43c0 3.25-2.27 5.47-5.55 5.47-3.03 0-5.11-1.87-5.11-4.65 0-2.86 2.23-4.85 5.42-4.85.37 0 .72.03 1.04.09v3.13a3.54 3.54 0 0 0-1.13-.18c-1.28 0-2.12.68-2.12 1.73 0 1.02.78 1.68 1.9 1.68 1.34 0 2.16-.81 2.16-2.31V2h3.33Z" />
    </svg>
  )
}
function IconYoutube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23 12s0-3.3-.42-4.88a2.55 2.55 0 0 0-1.8-1.8C19.2 4.9 12 4.9 12 4.9s-7.2 0-8.78.42a2.55 2.55 0 0 0-1.8 1.8C1 8.7 1 12 1 12s0 3.3.42 4.88a2.55 2.55 0 0 0 1.8 1.8c1.58.42 8.78.42 8.78.42s7.2 0 8.78-.42a2.55 2.55 0 0 0 1.8-1.8C23 15.3 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
    </svg>
  )
}

const linktreeUrl =
  "https://linktr.ee/randbservicesplus?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnByiGXkUuB7NwWb-pMin23uTWUT8gxnmKupPOTW_M8DomaPsRKFVyqPqrsJg_aem_xjHmF3x4Rf1Oz7sxwJwNQA"

const socials = [
  { icon: IconLinktree, label: "Linktree", href: linktreeUrl },
  { icon: IconWhatsapp, label: "WhatsApp", href: linktreeUrl },
  { icon: IconInstagram, label: "Instagram", href: "https://www.instagram.com/randbservicesplus/" },
  { icon: IconTiktok, label: "TikTok", href: "https://www.tiktok.com/@randbservicesplus" },
  { icon: IconFacebook, label: "Facebook", href: "https://www.facebook.com/randbserivcesplus.ca" },
  { icon: IconYoutube, label: "YouTube", href: "https://www.youtube.com/@RBServicesPlus" },
  { icon: IconLinkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/randb-services-plus/" },
]

export function SiteFooter() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function handleNewsletterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const form = event.currentTarget
    const formData = new FormData(form)
    setSubmitting(true)
    setError("")
    setMessage("")

    try {
      const response = await subscribeToNewsletter({
        email: String(formData.get("email") ?? ""),
        role: String(formData.get("role") ?? "") as NewsletterRole,
        source: "footer",
      })
      setSubmitted(true)
      setMessage(response.message)
      form.reset()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <footer id="contact" className="bg-gray-100 text-gray-950">
      <div className="mx-auto w-full max-w-[1600px] px-5 py-16 lg:px-8 lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-12 lg:grid-cols-[1.2fr_1fr]"
        >
          {/* Left: contact info */}
          <div>
            <Logo variant="light" />
            <p className="mt-5 max-w-md text-pretty leading-relaxed text-gray-700">
              Your Human Resources Partner — connecting Toronto and the GTA with the
              talent and opportunities that matter.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              <li className="flex items-center gap-3 text-gray-700">
                <Mail className="h-5 w-5 text-[var(--accent-glow)]" />
                info@randbservicesplus.ca
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <Phone className="h-5 w-5 text-[var(--accent-glow)]" />
                437-424-3615
              </li>
              <li className="flex items-center gap-3 text-gray-700">
                <MapPin className="h-5 w-5 text-[var(--accent-glow)]" />
                25 Watline Ave, Mississauga, ON L4Z 2Z1, Canada
              </li>
            </ul>
            <div className="mt-8 flex gap-3">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-700 transition-colors hover:border-[var(--accent-glow)] hover:bg-[var(--accent-glow)] hover:text-brand"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Right: newsletter */}
          <div id="subscribe" className="scroll-mt-28 rounded-3xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/5">
            <h3 className="text-2xl font-bold">Subscribe to our newsletter</h3>
            <p className="mt-2 text-sm text-gray-600">
              Job alerts, hiring tips and career insights — straight to your inbox.
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className="mt-6 space-y-4"
            >
              {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</p> : null}
              {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p> : null}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-950 placeholder:text-gray-400 outline-none transition-colors focus:border-[var(--accent-glow)] focus:bg-white"
                />
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-medium text-gray-700">
                  Are you a job seeker or an employer?
                </legend>
                <div className="flex gap-6 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="role" value="seeker" defaultChecked className="accent-[var(--accent-glow)]" />
                    Job Seeker
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="role" value="employer" className="accent-[var(--accent-glow)]" />
                    Employer
                  </label>
                </div>
              </fieldset>
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-[var(--accent-glow)] px-6 py-3.5 text-sm font-semibold text-brand transition-transform hover:scale-[1.02] disabled:pointer-events-none disabled:opacity-60"
              >
                {submitting ? "Submitting..." : submitted ? "Thanks for subscribing!" : "Submit"}
              </button>
            </form>
          </div>
        </motion.div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-gray-300 pt-6 text-xs text-gray-600 sm:flex-row">
          <span>© {new Date().getFullYear()} R&amp;B Services Plus Inc. All rights reserved.</span>
          <span>Your Human Resources Partner</span>
        </div>
      </div>
    </footer>
  )
}
