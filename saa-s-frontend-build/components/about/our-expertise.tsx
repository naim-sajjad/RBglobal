"use client"

import { useEffect, useRef, useState } from "react"
import { Code, Database, Shield, Cloud, Cpu, Smartphone } from "lucide-react"

export default function OurExpertise() {
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

  const expertise = [
    { icon: Code, title: "Full Stack Development", description: "Expert developers across all technology stacks" },
    { icon: Database, title: "Data Management", description: "Data engineers and architects for complex systems" },
    { icon: Cloud, title: "Cloud Solutions", description: "AWS, Azure, and GCP certified professionals" },
    { icon: Shield, title: "Cybersecurity", description: "Security specialists protecting your assets" },
    { icon: Cpu, title: "AI & Machine Learning", description: "Data scientists and ML engineers" },
    { icon: Smartphone, title: "Mobile Development", description: "iOS and Android development specialists" },
  ]

  return (
    <section ref={ref} className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#3B82F6]/5 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase">Our Expertise</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-6">
            Specialized IT Solutions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We provide talent across a full spectrum of IT positions, matching expertise with your unique needs.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {expertise.map((item, index) => (
            <div
              key={item.title}
              className={`group relative transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 80}ms` }}
            >
              <div className="relative h-full bg-gradient-to-br from-[#111827] to-[#1a2332] rounded-2xl p-6 border-2 border-[#111827]/50 group-hover:border-[#D4AF37] shadow-lg group-hover:shadow-[#D4AF37]/30 transition-all duration-500 overflow-hidden">
                {/* Hover background shift */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-[#3B82F6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-[#D4AF37] flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#3B82F6] transition-all duration-500">
                    <item.icon className="w-6 h-6 text-[#111827]" />
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-white/60 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Corner accent on hover */}
                <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-[#D4AF37]/10 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
