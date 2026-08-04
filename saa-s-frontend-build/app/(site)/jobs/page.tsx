import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { JobsHero } from "@/components/jobs-hero"
import { JobsGrid } from "@/components/jobs-grid"
import { SiteFooter } from "@/components/footer"

export const metadata: Metadata = {
  title: "Open Positions | R&B Services Plus Inc.",
  description:
    "Browse open positions in trucking, warehousing, general labour and office roles across Toronto and the GTA with R&B Services Plus Inc.",
}

export default function JobsPage() {
  return (
    <main className="bg-background">
      <SiteHeader />
      <JobsHero />
      <JobsGrid />
      <SiteFooter />
    </main>
  )
}
