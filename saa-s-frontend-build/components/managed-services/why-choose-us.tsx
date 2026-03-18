'use client'

import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Target, BarChart3 } from 'lucide-react'

const reasons = [
  {
    icon: TrendingUp,
    title: 'Proven Results',
    description:
      'Our track record speaks for itself. We consistently deliver outstanding outcomes for our clients, driving real business growth.',
    bgColor: 'from-red-50 to-red-100/50',
    iconColor: 'text-red-400',
  },
  {
    icon: Target,
    title: 'Customized Strategies',
    description:
      'We understand that every business is unique. Our strategies are tailored made to fit your specific goals, ensuring optimal results.',
    bgColor: 'from-green-50 to-green-100/50',
    iconColor: 'text-green-400',
  },
  {
    icon: BarChart3,
    title: 'Transparent Reporting',
    description:
      'Stay informed about your campaign\'s progress with detailed, transparent reports that highlight key metrics and insights.',
    bgColor: 'from-blue-50 to-blue-100/50',
    iconColor: 'text-blue-400',
  },
]

export default function WhyChooseUs() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-[#111827] text-center mb-16">Why Choose Us</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {reasons.map((reason, index) => {
            const Icon = reason.icon
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative p-8 rounded-xl border-2 transition-all duration-500 overflow-hidden ${
                  hoveredIndex === index
                    ? 'border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20'
                    : 'border-gray-200'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${reason.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />

                {/* Content */}
                <div className="relative z-10">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-all duration-500 ${
                      hoveredIndex === index
                        ? 'bg-[#D4AF37] scale-110'
                        : 'bg-gray-100'
                    }`}
                  >
                    <Icon
                      className={`w-7 h-7 transition-colors duration-500 ${
                        hoveredIndex === index ? 'text-[#111827]' : reason.iconColor
                      }`}
                    />
                  </div>

                  <h3
                    className={`text-xl font-bold mb-3 transition-colors duration-500 ${
                      hoveredIndex === index ? 'text-[#D4AF37]' : 'text-[#111827]'
                    }`}
                  >
                    {reason.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">{reason.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
