"use client"

import { useEffect, useRef, useState } from "react"
import {
  Code,
  Database,
  Shield,
  Network,
  Laptop,
  HeartPulse,
  Users,
  Cog,
  Monitor,
  Server,
  Gamepad2,
  BarChart3,
  ArrowRight,
} from "lucide-react"

export default function JobCategories() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const categories = [
    { icon: Code, name: "Software Developer", count: 156 },
    { icon: Database, name: "Data Management", count: 89 },
    { icon: Shield, name: "Cybersecurity", count: 67 },
    { icon: Network, name: "Network Engineer", count: 45 },
    { icon: Laptop, name: "IT Support", count: 123 },
    { icon: HeartPulse, name: "Healthcare IT", count: 34 },
    { icon: Users, name: "IT Management", count: 28 },
    { icon: Cog, name: "System Admin", count: 52 },
    { icon: Monitor, name: "QA Testing", count: 78 },
    { icon: Server, name: "Cloud Computing", count: 91 },
    { icon: Gamepad2, name: "Game Development", count: 23 },
    { icon: BarChart3, name: "Data Analytics", count: 104 },
  ]

  return (
    <section ref={sectionRef} className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className={`inline-block px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-6 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Browse Categories
          </span>
          <h2
            className={`text-4xl md:text-5xl font-bold text-[#111827] mb-6 transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Explore Job Categories
          </h2>
          <p
            className={`text-gray-600 text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Find your perfect role in one of our popular job categories
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category, index) => (
            <button
              key={category.name}
              type="button"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`group relative rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 overflow-hidden text-left border-2 ${
                hoveredIndex === index 
                  ? "bg-[#D4AF37] border-[#D4AF37] shadow-2xl shadow-[#D4AF37]/30" 
                  : "bg-[#111827] border-[#111827] shadow-xl"
              } ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + index * 50}ms` }}
            >
              {/* Animated shimmer effect on hover */}
              <div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 ${
                  hoveredIndex === index ? "translate-x-full" : ""
                }`}
              />

              {/* Content */}
              <div className="relative">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 ${
                    hoveredIndex === index 
                      ? "bg-[#111827] scale-110 rotate-3" 
                      : "bg-white/10"
                  }`}
                >
                  <category.icon
                    className={`w-7 h-7 transition-colors duration-500 ${
                      hoveredIndex === index ? "text-[#D4AF37]" : "text-[#D4AF37]"
                    }`}
                  />
                </div>

                <h3 className={`font-semibold mb-2 transition-colors duration-500 ${
                  hoveredIndex === index ? "text-[#111827]" : "text-white"
                }`}>
                  {category.name}
                </h3>

                <div className="flex items-center justify-between">
                  <span className={`text-sm transition-colors duration-500 ${
                    hoveredIndex === index ? "text-[#111827]/70" : "text-white/60"
                  }`}>
                    {category.count} jobs
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full transition-all duration-500 ${
                      hoveredIndex === index 
                        ? "bg-[#111827] text-[#D4AF37]" 
                        : "bg-[#D4AF37] text-[#111827]"
                    }`}
                  >
                    View
                    <ArrowRight className={`w-3 h-3 transition-transform duration-300 ${
                      hoveredIndex === index ? "translate-x-1" : ""
                    }`} />
                  </span>
                </div>
              </div>

              {/* Animated corner decoration */}
              <div
                className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full transition-all duration-500 ${
                  hoveredIndex === index 
                    ? "bg-[#111827]/20 scale-150" 
                    : "bg-[#D4AF37]/10 scale-100"
                }`}
              />
              
              {/* Top corner accent */}
              <div
                className={`absolute top-0 right-0 w-16 h-16 transition-all duration-500 ${
                  hoveredIndex === index ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#111827]" />
                <div className="absolute top-3 right-7 w-1 h-1 rounded-full bg-[#111827]/50" />
                <div className="absolute top-7 right-3 w-1 h-1 rounded-full bg-[#111827]/50" />
              </div>
            </button>
          ))}
        </div>

        {/* View All Button */}
        <div
          className={`text-center mt-14 transition-all duration-700 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 px-10 py-5 bg-[#111827] text-white rounded-full font-semibold hover:bg-[#D4AF37] hover:text-[#111827] transition-all duration-300 hover:scale-105 shadow-xl group"
          >
            View All Categories
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  )
}
