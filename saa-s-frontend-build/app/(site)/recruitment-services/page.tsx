'use client'

import RecruitmentsHero from '@/components/recruitment-services/recruitment-hero'
import ServiceOverview from '@/components/recruitment-services/service-overview'
import GlobalTechRecruitment from '@/components/recruitment-services/global-tech-recruitment'
import HowItWorks from '@/components/recruitment-services/how-it-works'
import ChooseClassifications from '@/components/recruitment-services/choose-classifications'
import FinalCTA from '@/components/recruitment-services/final-cta'
import Header from "@/components/web/Header"
import Footer from '@/components/footer'

export default function RecruitmentServices() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <RecruitmentsHero />
      <ServiceOverview />
      <GlobalTechRecruitment />
      <HowItWorks />
      <ChooseClassifications />
      <FinalCTA />
      <Footer />
    </main>
  )
}
