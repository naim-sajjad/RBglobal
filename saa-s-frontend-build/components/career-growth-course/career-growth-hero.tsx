"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

export default function CareerGrowthHero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#111827] to-[#1a2332]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop')",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111827]/95 via-[#111827]/85 to-[#111827]/75" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Breadcrumb */}
        <div className={`mb-8 text-white/70 text-sm flex items-center gap-2 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <span>Home</span>
          <span>›</span>
          <span className="text-[#D4AF37]">Career Growth Course</span>
        </div>

        {/* Title */}
        <h1 className={`text-5xl md:text-6xl font-bold text-white text-center max-w-4xl mb-6 transition-all duration-1000 delay-200 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          Career Growth Course
        </h1>

        {/* Decorative Line */}
        <div className={`h-1 w-24 bg-gradient-to-r from-[#D4AF37] to-[#3B82F6] mb-12 transition-all duration-1000 delay-300 ${
          isVisible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
        }`} />

        {/* Scroll Indicator */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 transition-all duration-1000 delay-500 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-white/60 text-sm">Scroll to explore</span>
            <ChevronDown className="w-6 h-6 text-[#D4AF37] animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}
