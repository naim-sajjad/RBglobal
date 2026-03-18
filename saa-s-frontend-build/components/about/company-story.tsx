"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

export default function CompanyStory() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-[#111827] to-[#1a2332] relative overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/4 w-72 h-72 rounded-full bg-[#D4AF37]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-[#3B82F6]/5 blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div
            className={`relative transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            <div className="relative h-[450px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#D4AF37]/30">
              <Image
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
                alt="Our Story"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-[#D4AF37] rounded-3xl opacity-50" />
            <div className="absolute -top-4 -left-4 w-24 h-24 border-2 border-[#3B82F6] rounded-3xl opacity-50" />
          </div>

          {/* Content */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div className="inline-block mb-6">
              <span className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase">Our Story</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              Revolutionizing IT <span className="text-[#D4AF37]">Recruitment</span>
            </h2>

            <div className="space-y-6 text-white/80 text-lg leading-relaxed">
              <p>
                GenNext Global Tech is an IT recruitment company with a mission to revolutionize how organizations and talented professionals connect. We understand that the right staff can become the engine that feeds efficiencies, performance, innovation, and growth.
              </p>

              <p>
                When done right, staffing and recruitment services become a valuable extension of an organization's HR processes. We take pride in providing unprecedented access to global talent while ensuring equal opportunity for all candidates.
              </p>

              <p>
                Our deep understanding of effective employee/contractor and organizational relationships positions us as your HR partner of choice, whether you're seeking top talent or launching your career in IT.
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-[#D4AF37] font-semibold text-lg mb-4">Let's Work Together!</p>
              <p className="text-white/70">
                Partner with GenNext Global Tech to unlock the full potential of your organization and career.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
