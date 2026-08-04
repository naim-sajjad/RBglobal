"use client"

import { SiteHeader } from "@/components/web/Header"
import { Hero } from "@/components/hero"
import { Industries } from "@/components/industries"
import { Services } from "@/components/services"
import { Insights } from "@/components/insights"
import { Testimonials } from "@/components/testimonials"
import { SiteFooter } from "@/components/footer"

export default function Page() {
  return (
    <main className="bg-background">
      <SiteHeader />
      <Hero />
      <Industries />
      <Services />
      <Insights />
      <Testimonials />
      <SiteFooter />
    </main>
  )
}
