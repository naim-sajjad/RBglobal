import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { CareerGrowthForm } from "@/components/career-growth-form"
import { SiteFooter } from "@/components/footer"

export const metadata: Metadata = {
  title: "Career Growth Registration | R&B Services Plus Inc.",
  description: "Register for the R&B Services Plus Career Growth Course.",
}

export default function CareerGrowthFormPage() {
  return <main className="bg-background">
    <SiteHeader />
    <CareerGrowthForm />
    <SiteFooter />
  </main>
}
