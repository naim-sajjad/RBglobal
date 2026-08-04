import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { InsightsHero } from "@/components/insights-hero"
import { InsightsList } from "@/components/insights-list"
import { SiteFooter } from "@/components/footer"
export const metadata: Metadata = {
  title: "Insights | R&B Services Plus Inc.",
  description:
    "Career advice, interview tips, resume guidance and industry trends from R&B Services Plus Inc. to help you stand out and land your dream job.",
}

export default function InsightsPage() {
  return (
    <main className="bg-background">
      <SiteHeader />
      <InsightsHero />
      <InsightsList />
      <SiteFooter />
    </main>
  )
}
