import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { SiteFooter } from "@/components/footer"
import { EmployersHero } from "@/components/employers/employers-hero"
import { StaffingSolutions } from "@/components/employers/staffing-solutions"
import { HiringProcess } from "@/components/employers/hiring-process"
import { EmployersCta } from "@/components/employers/employers-cta"

export const metadata: Metadata = {
  title: "Staffing Services for Employers | R&B Services Plus Inc.",
  description:
    "Hire interview-ready talent for trucking, warehousing, industrial and office roles across Toronto and the GTA. Temporary, temp-to-perm and direct-hire staffing from a 100% Canadian-owned recruitment partner.",
}

export default function EmployersPage() {
  return (
    <main className="bg-background">
      <SiteHeader />
      <EmployersHero />
      <StaffingSolutions />
      <HiringProcess />
      <EmployersCta />
      <SiteFooter />
    </main>
  )
}
