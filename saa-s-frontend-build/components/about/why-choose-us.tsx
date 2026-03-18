"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle } from "lucide-react"

export default function WhyChooseUs() {
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

  const reasons = [
    "15+ years of experience in IT recruitment",
    "Extensive network of vetted professionals",
    "Personalized matching process",
    "Global access to talent",
    "Dedicated account management",
    "Fast placement turnaround",
    "Competitive rates and flexible terms",
    "Post-placement support",
  ]

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-[#111827] via-[#1a2332] to-[#111827] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-80 h-80 rounded-full bg-[#3B82F6]/5 blur-3xl" />
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
              <span className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase">Why Choose Us</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
              Your Trusted <span className="text-[#D4AF37]">Recruitment</span> Partner
            </h2>

            <p className="text-lg text-white/80 mb-8 leading-relaxed">
              We're not just a recruitment agency. We're your strategic partner in building high-performing teams and advancing careers.
            </p>

            <div className="space-y-4">
              {reasons.map((reason, index) => (
                <div
                  key={reason}
                  className={`flex items-start gap-4 transition-all duration-700 ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : "opacity-0 -translate-x-8"
                  }`}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="w-6 h-6 text-[#D4AF37]" />
                  </div>
                  <span className="text-white/80 text-lg">{reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Cards */}
          <div
            className={`transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            }`}
          >
            <div className="space-y-6">
              {[
                { number: "500+", label: "Successful Placements", color: "from-[#D4AF37] to-[#B8962E]" },
                { number: "1000+", label: "Active Candidates", color: "from-[#3B82F6] to-[#1E40AF]" },
                { number: "150+", label: "Satisfied Clients", color: "from-[#D4AF37] to-[#3B82F6]" },
                { number: "15+", label: "Years in Business", color: "from-[#B8962E] to-[#D4AF37]" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`group relative transition-all duration-700 ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className={`bg-gradient-to-r ${stat.color} rounded-2xl p-8 shadow-lg group-hover:shadow-2xl transition-all duration-500 overflow-hidden relative`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    <div className="relative">
                      <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                      <p className="text-white/80 font-semibold">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
