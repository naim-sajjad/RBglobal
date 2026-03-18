"use client"

import { useEffect, useState } from "react"
import { Users, Lightbulb, Target, Network, Zap } from "lucide-react"

const features = [
  {
    title: "Experienced Instructors",
    description: "Our courses are led by seasoned professionals with a wealth of industry knowledge and experience.",
    icon: Users,
  },
  {
    title: "Interactive Learning",
    description: "Engage in practical exercises, workshops, and mock interviews to apply what you've learned.",
    icon: Lightbulb,
  },
  {
    title: "Customized Guidance",
    description: "We understand that each career journey is unique. Our instructors provide personalized guidance tailored to your goals.",
    icon: Target,
  },
  {
    title: "Networking Opportunities",
    description: "Connect with a diverse group of like-minded individuals and expand your professional network.",
    icon: Network,
  },
  {
    title: "Flexible Learning Options",
    description: "Choose from multiple virtual sessions that suit your schedule",
    icon: Zap,
  },
]

export default function WhatSetsUsApart() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    })
    const element = document.getElementById("what-sets-us-apart")
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="what-sets-us-apart" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Title */}
        <div className={`text-center mb-16 transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
            What sets our Career Growth Course apart?
          </h2>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.title}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative rounded-2xl p-8 border-2 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                  hoveredIndex === index
                    ? "bg-[#D4AF37] border-[#D4AF37] shadow-xl shadow-[#D4AF37]/30"
                    : "bg-white border-gray-200 shadow-lg"
                } ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${200 + index * 80}ms` }}
              >
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-500 ${
                  hoveredIndex === index
                    ? "bg-[#111827] scale-110"
                    : "bg-[#D4AF37]/10"
                }`}>
                  <IconComponent className={`w-7 h-7 transition-colors duration-500 ${
                    hoveredIndex === index ? "text-[#D4AF37]" : "text-[#D4AF37]"
                  }`} />
                </div>

                {/* Title */}
                <h3 className={`font-bold text-lg mb-3 transition-colors duration-500 ${
                  hoveredIndex === index ? "text-[#111827]" : "text-[#111827]"
                }`}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className={`text-sm leading-relaxed transition-colors duration-500 ${
                  hoveredIndex === index ? "text-[#111827]/70" : "text-gray-600"
                }`}>
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
