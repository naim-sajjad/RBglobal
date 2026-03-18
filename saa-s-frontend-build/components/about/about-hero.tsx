"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function AboutHero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-[500px] bg-gradient-to-br from-[#111827] via-[#1a2332] to-[#111827] overflow-hidden pt-20 pb-16">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-[#3B82F6]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div className="inline-block mb-6">
              <span className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase">About GenNextGlobalTech</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Connecting <span className="text-[#D4AF37]">Talent</span> with <span className="text-[#3B82F6]">Opportunity</span>
            </h1>

            <p className="text-xl text-white/80 mb-8 leading-relaxed">
              GenNext Global Tech is your trusted partner in IT recruitment. We bridge the gap between world-class organizations and exceptional talent, creating meaningful professional relationships that drive growth and innovation.
            </p>

            <div className="flex gap-4">
              <button className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-[#D4AF37] px-8 py-3 rounded-full font-semibold transition-all duration-300">
                Learn More
              </button>
              <button className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111827] px-8 py-3 rounded-full font-semibold transition-all duration-300">
                Contact Us
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div className="relative h-[500px] rounded-3xl overflow-hidden shadow-2xl shadow-[#D4AF37]/20 border-2 border-[#D4AF37]/30">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                alt="GenNextGlobalTech Team"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>

            {/* Floating decorative card */}
            <div className="absolute -bottom-6 -left-6 bg-white/95 rounded-2xl p-6 shadow-xl w-48 backdrop-blur-sm">
              <div className="text-3xl font-bold text-[#111827] mb-2">15+</div>
              <p className="text-sm text-gray-600">Years of Excellence in IT Recruitment</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
