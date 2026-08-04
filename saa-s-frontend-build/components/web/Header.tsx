"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Menu, X } from "lucide-react"
import { Logo } from "@/components/logo"

const navLinks = [
  { label: "Home", href: "/#home" },
  { label: "Jobs", href: "/jobs" },
  { label: "Insights", href: "/insights" },
  { label: "Group Chat", href: "/group-chat" },
  { label: "Career Course", href: "/career-growth-course" },
  { label: "Contact", href: "/contact" },
  { label: "Subscribe", href: "/home/#subscribe" },
]

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

function IconTiktok(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.6 2c.3 2.58 1.74 4.12 4.22 4.28v3.08a7.18 7.18 0 0 1-4.16-1.26v6.43c0 3.25-2.27 5.47-5.55 5.47-3.03 0-5.11-1.87-5.11-4.65 0-2.86 2.23-4.85 5.42-4.85.37 0 .72.03 1.04.09v3.13a3.54 3.54 0 0 0-1.13-.18c-1.28 0-2.12.68-2.12 1.73 0 1.02.78 1.68 1.9 1.68 1.34 0 2.16-.81 2.16-2.31V2h3.33Z" />
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

function IconYoutube(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23 12s0-3.3-.42-4.88a2.55 2.55 0 0 0-1.8-1.8C19.2 4.9 12 4.9 12 4.9s-7.2 0-8.78.42a2.55 2.55 0 0 0-1.8 1.8C1 8.7 1 12 1 12s0 3.3.42 4.88a2.55 2.55 0 0 0 1.8 1.8c1.58.42 8.78.42 8.78.42s7.2 0 8.78-.42a2.55 2.55 0 0 0 1.8-1.8C23 15.3 23 12 23 12ZM9.75 15.02V8.98L15.5 12l-5.75 3.02Z" />
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

const linktreeUrl =
  "https://linktr.ee/randbservicesplus?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnByiGXkUuB7NwWb-pMin23uTWUT8gxnmKupPOTW_M8DomaPsRKFVyqPqrsJg_aem_xjHmF3x4Rf1Oz7sxwJwNQA"

const socialLinks = [
  { icon: IconLinktree, label: "Linktree", href: linktreeUrl },
  { icon: IconWhatsapp, label: "WhatsApp", href: linktreeUrl },
  { icon: IconInstagram, label: "Instagram", href: "https://www.instagram.com/randbservicesplus/" },
  { icon: IconTiktok, label: "TikTok", href: "https://www.tiktok.com/@randbservicesplus" },
  { icon: IconFacebook, label: "Facebook", href: "https://www.facebook.com/randbserivcesplus.ca" },
  { icon: IconYoutube, label: "YouTube", href: "https://www.youtube.com/@RBServicesPlus" },
  { icon: IconLinkedin, label: "LinkedIn", href: "https://www.linkedin.com/company/randb-services-plus/" },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-border bg-background/90 shadow-sm backdrop-blur-xl"
          : "border-transparent bg-background"
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-5 px-5 py-3 lg:px-8">
        <Logo variant="light" />

        <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative whitespace-nowrap text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 lg:flex">
          <div className="flex items-center gap-1">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                aria-label={social.label}
                target={social.href.startsWith("http") ? "_blank" : undefined}
                rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-foreground/75 transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <a
            href="/apply-form/"
            className="whitespace-nowrap rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105"
          >
            Apply Now
          </a>
          <div className="flex items-center gap-4 whitespace-nowrap border-l border-border pl-4">
            <a
              href="/driver/register/"
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
            >
              Register
            </a>
            <span aria-hidden="true" className="text-sm text-foreground/40">/</span>
            <a
              href="/login/"
              className="text-sm font-medium text-foreground/75 transition-colors hover:text-primary"
            >
              Login
            </a>
          </div>
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="text-foreground lg:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-5 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-foreground/70 hover:bg-accent hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
              <div className="flex items-center gap-2 px-3 py-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel={social.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    onClick={() => setOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground/75 transition-colors hover:border-primary/20 hover:bg-primary/10 hover:text-primary"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              <a
                href="/apply-form/"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
              >
                Apply Now
              </a>
              <div className="mt-2 flex items-center justify-center gap-8 border-t border-border pt-4">
                <a
                  href="/driver/register/"
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  Register
                </a>
                <span aria-hidden="true" className="text-sm text-foreground/40">/</span>
                <a
                  href="/login/"
                  onClick={() => setOpen(false)}
                  className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                >
                  Login
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
