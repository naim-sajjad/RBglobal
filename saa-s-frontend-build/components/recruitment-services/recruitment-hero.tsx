'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export default function RecruitmentsHero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative h-screen bg-[#111827] text-white overflow-hidden flex items-center justify-center">
      {/* Background Image Overlay */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/80 to-[#111827]/60" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 left-1/4 w-72 h-72 bg-[#3B82F6]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center max-w-4xl mx-auto px-4 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-2 mb-6 text-sm">
          <Link href="/" className="text-[#D4AF37] hover:text-white transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 text-white/50" />
          <span className="text-white/70">Recruitment Services</span>
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Recruitment
          <span className="block text-[#D4AF37]">Services</span>
        </h1>

        {/* Description */}
        <p className="text-lg text-white/80 max-w-2xl mx-auto">
          Connect with top talent and exceptional opportunities through our comprehensive recruitment solutions tailored for both employers and job seekers.
        </p>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-white/50 text-sm">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-[#D4AF37] rounded-full flex items-center justify-center">
            <div className="w-1 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  )
}
