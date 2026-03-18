"use client"

import { useEffect, useRef, useState } from "react"
import { Zap, Heart, Target } from "lucide-react"

export default function ValueProposition() {
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

  const propositions = [
    {
      icon: Heart,
      title: "Talent First Approach",
      description: "We believe great organizations are built on great people. We connect exceptional talent with organizations that value and recognize their contributions.",
    },
    {
      icon: Target,
      title: "Right Fit Matching",
      description: "We take pride in matching the right talent to the right position. Our expertise ensures both parties benefit from a perfect professional partnership.",
    },
    {
      icon: Zap,
      title: "Growth Partnership",
      description: "We inspire the intrapreneur in every candidate, ensuring your work is valued and recognized for rapid advancement and career growth.",
    },
  ]

  return (
    <section ref={ref} className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase">Our Value Proposition</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-6">
            What Makes Us Different
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We go beyond recruitment. We build lasting partnerships that drive growth, innovation, and success.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {propositions.map((prop, index) => (
            <div
              key={prop.title}
              className={`group relative transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 border-2 border-gray-100 hover:border-[#D4AF37] shadow-lg group-hover:shadow-xl group-hover:shadow-[#D4AF37]/20 transition-all duration-500">
                {/* Icon container */}
                <div className="w-16 h-16 rounded-xl bg-[#111827] flex items-center justify-center mb-6 group-hover:bg-[#D4AF37] group-hover:scale-110 transition-all duration-500">
                  <prop.icon className="w-8 h-8 text-[#D4AF37] group-hover:text-[#111827] transition-colors" />
                </div>

                <h3 className="text-2xl font-bold text-[#111827] mb-4 group-hover:text-[#D4AF37] transition-colors">
                  {prop.title}
                </h3>

                <p className="text-gray-600 leading-relaxed mb-6">
                  {prop.description}
                </p>

                {/* Animated divider */}
                <div className="h-1 w-0 bg-gradient-to-r from-[#D4AF37] to-[#3B82F6] group-hover:w-12 transition-all duration-500" />

                {/* Hover accent */}
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-[#D4AF37]/10 -z-10 group-hover:scale-150 transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
