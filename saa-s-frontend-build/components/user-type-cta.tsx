"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Building2, User, ArrowRight, CheckCircle2, Sparkles } from "lucide-react"

export default function UserTypeCTA() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const cards = [
    {
      icon: Building2,
      title: "I am an Employer",
      description: "Find the perfect candidates for your team",
      cta: "Find Your Next Hire",
      benefits: [
        "Access to thousands of qualified candidates",
        "Advanced filtering and matching",
        "Company branding opportunities",
      ],
    },
    {
      icon: User,
      title: "I am a Job Seeker",
      description: "Discover your next career opportunity",
      cta: "Find Your Next Job",
      benefits: [
        "Personalized job recommendations",
        "Easy application process",
        "Career resources and tips",
      ],
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(#111827 1px, transparent 1px)`,
            backgroundSize: '30px 30px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-16">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-6 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Get Started Today
          </div>
          <h2
            className={`text-4xl md:text-5xl font-bold text-[#111827] mb-6 transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            How Can We Help You?
          </h2>
          <p
            className={`text-gray-600 text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Whether you're looking to hire or get hired, GenNextGlobalTech has you covered
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {cards.map((card, index) => (
            <div
              key={card.title}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`group relative bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 border border-gray-100 overflow-hidden ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${300 + index * 150}ms` }}
            >
              {/* Animated background gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-[#D4AF37]/10 transition-opacity duration-500 ${
                  hoveredCard === index ? "opacity-100" : "opacity-0"
                }`}
              />
              
              {/* Floating particles on hover */}
              <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-500 ${hoveredCard === index ? 'opacity-100' : 'opacity-0'}`}>
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-[#D4AF37]/30 rounded-full animate-bounce"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>

              {/* Corner decoration */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#D4AF37]/10 group-hover:scale-150 transition-transform duration-700" />

              <div className="relative">
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-[#111827] flex items-center justify-center mb-8 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                  <card.icon className="w-10 h-10 text-[#D4AF37]" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-[#111827] mb-3">
                  {card.title}
                </h3>
                <p className="text-gray-600 mb-8">{card.description}</p>

                {/* Benefits */}
                <ul className="space-y-4 mb-10">
                  {card.benefits.map((benefit, i) => (
                    <li
                      key={benefit}
                      className={`flex items-start gap-3 text-gray-600 transition-all duration-500 ${
                        isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                      }`}
                      style={{ transitionDelay: `${500 + index * 150 + i * 100}ms` }}
                    >
                      <div className="w-6 h-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      {benefit}
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  className="w-full bg-[#111827] hover:bg-[#D4AF37] text-white hover:text-[#111827] rounded-xl py-7 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group/btn"
                >
                  {card.cta}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover/btn:translate-x-2 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
