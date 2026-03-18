"use client"

import { ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function PPCHero() {
  return (
    <section className="relative min-h-[340px] overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/ppc-hero.jpg"
        alt="Pay Per Click Advertising"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/80 via-[#111827]/60 to-[#111827]/40" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
          <Link href="/" className="hover:text-[#D4AF37] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white">Pay Per Click (PPC) Advertising</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-balance">
          Pay Per Click (PPC) Advertising
        </h1>
      </div>
    </section>
  )
}
