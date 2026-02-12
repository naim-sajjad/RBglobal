"use client"

import Header from "@/components/web/Header"
import Hero from "@/components/hero"
import UserTypeCTA from "@/components/user-type-cta"
import JobSearch from "@/components/job-search"
import JobCategories from "@/components/job-categories"
import FeaturedJobs from "@/components/featured-jobs"
import FeaturedCandidates from "@/components/featured-candidates"
import Statistics from "@/components/statistics"
import Testimonials from "@/components/testimonials"
import Footer from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <Hero />
      <UserTypeCTA />
      <JobSearch />
      <JobCategories />
      <FeaturedJobs />
      <FeaturedCandidates />
      <Statistics />
      <Testimonials />
      <Footer />
    </main>
  )
}
