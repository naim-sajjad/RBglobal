'use client'

import ManagedServicesHero from '@/components/managed-services/managed-services-hero'
import WhatWeDo from '@/components/managed-services/what-we-do'
import OurExpertise from '@/components/managed-services/our-expertise'
import ClientWork from '@/components/managed-services/client-work'
import TheProject from '@/components/managed-services/the-project'
import WhyChooseUs from '@/components/managed-services/why-choose-us'
import ManagedServicesCTA from '@/components/managed-services/managed-services-cta'
import Header from "@/components/web/Header"
import Footer from "@/components/footer"

export default function ManagedServicesPage() {
  return (
    <main className="min-h-screen bg-background">
       <Header />
      <ManagedServicesHero />
      <WhatWeDo />
      <OurExpertise />
      <ClientWork />
      <TheProject />
      <WhyChooseUs />
      <ManagedServicesCTA />
       <Footer />
    </main>
  )
}
