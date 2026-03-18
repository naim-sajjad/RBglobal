"use client"

import { ChevronRight, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ContactHero() {
  return (
    <div className="relative w-full bg-gradient-to-br from-[#111827] to-[#1a2a3a] overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-40">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <defs>
            <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#D4AF37" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>

      <div className="absolute inset-0">
        <div className="absolute top-40 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 text-white/60 text-sm mb-6 animate-fade-in">
            <Link href="/" className="hover:text-[#D4AF37] transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Contact Us</span>
          </div>

          {/* Main Title */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 animate-fade-in-up text-balance">
            Let's Work Together
          </h1>

          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8 animate-fade-in-up delay-100 leading-relaxed">
            Have a question or ready to partner with GenNextGlobalTech? Our dedicated team is here to help you achieve your goals.
          </p>

          {/* Quick Contact Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
            <Button className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white rounded-lg px-8 h-14 font-semibold transition-all duration-300 flex items-center justify-center gap-2 group">
              Start a Conversation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#111827] rounded-lg px-8 h-14 font-semibold transition-all duration-300">
              Schedule a Call
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <span className="text-white/50 text-xs">Scroll to explore</span>
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-center justify-center">
            <div className="w-1 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
