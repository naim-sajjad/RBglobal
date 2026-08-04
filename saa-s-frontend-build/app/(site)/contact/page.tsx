import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { ContactHero } from "@/components/contact-hero"
import { ContactForm } from "@/components/contact-form"
import { SiteFooter } from "@/components/footer"

export const metadata: Metadata = {
  title: "Contact Us | R&B Services Plus Inc.",
  description:
    "Get in touch with R&B Services Plus Inc. Whether you're hiring or looking for work in trucking, warehousing or office roles across Toronto and the GTA, our team is ready to help.",
}

export default function ContactPage() {
  return (
    <main className="bg-background">
      <SiteHeader />
      <ContactHero />
      <ContactForm />
      <SiteFooter />
    </main>
  )
}
