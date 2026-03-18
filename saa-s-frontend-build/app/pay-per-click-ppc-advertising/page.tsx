import type { Metadata } from "next"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PPCHero from "@/components/ppc/ppc-hero"
import PPCSpecialties from "@/components/ppc/ppc-specialties"
import PPCOfferings from "@/components/ppc/ppc-offerings"
import PPCTestimonials from "@/components/ppc/ppc-testimonials"
import PPCCTA from "@/components/ppc/ppc-cta"

export const metadata: Metadata = {
  title: "Pay Per Click (PPC) Advertising | GenNextGlobalTech",
  description:
    "Drive targeted traffic and maximize ROI with GenNextGlobalTech's expert PPC advertising services including e-commerce PPC, B2B lead generation, and campaign optimization.",
}

export default function PPCAdvertisingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <PPCHero />
      <PPCSpecialties />
      <PPCOfferings />
      <PPCTestimonials />
      <PPCCTA />
      <Footer />
    </main>
  )
}
