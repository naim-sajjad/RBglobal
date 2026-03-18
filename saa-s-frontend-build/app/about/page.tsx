"use client"

import Header from "@/components/web/Header"
import Footer from "@/components/footer"
import AboutHero from "@/components/about/about-hero"
import ValueProposition from "@/components/about/value-proposition"
import CompanyStory from "@/components/about/company-story"
import OurExpertise from "@/components/about/our-expertise"
import WhyChooseUs from "@/components/about/why-choose-us"
import TeamSection from "@/components/about/team-section"
import CallToAction from "@/components/about/call-to-action"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <AboutHero />
      <ValueProposition />
      <CompanyStory />
      <OurExpertise />
      <WhyChooseUs />
      <TeamSection />
      <CallToAction />
      <Footer />
    </main>
  )
}
