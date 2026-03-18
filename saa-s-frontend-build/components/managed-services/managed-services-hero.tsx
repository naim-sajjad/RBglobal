'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'

export default function ManagedServicesHero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-r from-[#111827]/95 to-[#111827]/90">
      {/* Background image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&h=1080&fit=crop)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        {/* Breadcrumb */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Link href="/" className="text-white/70 hover:text-[#D4AF37] transition-colors">
            Home
          </Link>
          <ChevronDown className="w-4 h-4 text-white/50 rotate-90" />
          <span className="text-white/70">Managed Services</span>
        </div>

        {/* Main heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 text-balance">
          Managed Services
        </h1>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/50 text-sm">Scroll to explore</span>
            <ChevronDown className="w-6 h-6 text-[#D4AF37]" />
          </div>
        </div>
      </div>
    </section>
  )
}
