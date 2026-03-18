import Header from "@/components/web/Header"
import Footer from "@/components/footer"
import CareerGrowthHero from "@/components/career-growth-course/career-growth-hero"
import CourseIntro from "@/components/career-growth-course/course-intro"
import CourseModules from "@/components/career-growth-course/course-modules"
import WhatSetsUsApart from "@/components/career-growth-course/what-sets-us-apart"
import CourseCTA from "@/components/career-growth-course/course-cta"

export const metadata = {
  title: "Career Growth Course - GenNextGlobalTech",
  description: "Comprehensive career development course designed to equip professionals with essential skills for career advancement.",
}

export default function CareerGrowthCoursePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <CareerGrowthHero />
      <CourseIntro />
      <CourseModules />
      <WhatSetsUsApart />
      <CourseCTA />
      <Footer />
    </main>
  )
}
