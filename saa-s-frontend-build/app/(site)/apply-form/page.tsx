import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { ApplyForm } from "@/components/apply-form"
import { SiteFooter } from "@/components/footer"

export const metadata: Metadata = {
  title: "Apply Now | R&B Services Plus Inc.",
  description: "Submit your employment application to R&B Services Plus.",
}

export default async function ApplyFormPage({ searchParams }: { searchParams: Promise<{ job?: string }> }) {
  const { job = "" } = await searchParams

  return <main className="bg-background">
    <SiteHeader />
    <ApplyForm initialJob={job} />
    <SiteFooter />
  </main>
}
