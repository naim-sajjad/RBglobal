"use client"

import ContactHero from "@/components/contact/contact-hero"
import ContactForm from "@/components/contact/contact-form"
import ContactInfo from "@/components/contact/contact-info"
import MapSection from "@/components/contact/map-section"
import Faq from "@/components/contact/faq"
import Header from "@/components/web/Header"
import Footer from "@/components/footer"

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
       <Header />
      <ContactHero />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
          <div>
            <ContactInfo />
          </div>
        </div>
      </div>
      <MapSection />
      <Faq />
            <Footer />
    </main>
  )
}
