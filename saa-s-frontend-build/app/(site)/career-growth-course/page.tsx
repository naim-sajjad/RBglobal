import type { Metadata } from "next"
import { SiteHeader } from "@/components/web/Header"
import { SiteFooter } from "@/components/footer"
import { CourseHero } from "@/components/course-hero"
import { CourseModules } from "@/components/course-modules"
import { CourseSkills } from "@/components/course-skills"

export const metadata: Metadata = {
  title: "Career Growth Course | R&B Services Plus Inc.",
  description:
    "From crafting the perfect resume to excelling in the workplace, the Career Growth Course prepares you for long term success — resume building, interview prep, workplace success, and more.",
}

export default function CareerGrowthCoursePage() {
  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      <CourseHero />
      <CourseModules />
      <CourseSkills />
      <SiteFooter />
    </main>
  )
}
