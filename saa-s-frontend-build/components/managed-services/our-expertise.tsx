'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, Mail, Edit3, Palette, Search, DollarSign, Lightbulb, Package } from 'lucide-react'

const expertise = [
  {
    icon: Share2,
    title: 'Social Media Marketing',
    description: 'Leverage the power of social media platforms to connect, engage, and convert. Our approach ensures your brand stays relevant and resonates with your followers.',
  },
  {
    icon: Mail,
    title: 'Email Marketing',
    description: 'Nurture leads and strengthen customer relationships through targeted email campaigns. We craft personalized messages that resonate with your subscribers, driving action and loyalty.',
  },
  {
    icon: Edit3,
    title: 'Content Marketing',
    description: 'Engage your audience with compelling content that educates and inspires. From blog posts and articles to infographics and videos, we create content that establishes industry authority.',
  },
  {
    icon: Palette,
    title: 'Branding Services',
    description: 'Define a memorable brand identity that resonates with your audience. We craft logos, brand guidelines, and messaging strategies that embody your values and mission.',
  },
  {
    icon: Search,
    title: 'Search Engine Optimization (SEO)',
    description: 'Boost your website\'s visibility in search results and drive organic traffic that matters. Our SEO strategies are meticulously crafted to improve your rankings and increase conversions.',
  },
  {
    icon: DollarSign,
    title: 'Pay-Per-Click (PPC) Advertising',
    description: 'Get immediate visibility with PPC campaigns. We optimize your ad spend to ensure maximum ROI, driving high-quality traffic and conversions.',
  },
  {
    icon: Lightbulb,
    title: 'Business Development Strategies',
    description: 'Unlock new avenues for growth with our business development solutions. We provide market analysis, competitive insights, and strategic planning to expand your reach.',
  },
  {
    icon: Package,
    title: 'Product Packaging and Label Design',
    description: 'Elevate your product\'s visual appeal with customized packaging and label designs. Our mock-ups showcase your offerings with creativity, leaving a lasting impact on your customers.',
  },
]

export default function OurExpertise() {
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
      { threshold: 0.1 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-[#111827] text-center mb-16">Our Expertise</h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {expertise.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative p-8 rounded-xl border-2 transition-all duration-500 ${
                  hoveredIndex === index
                    ? 'bg-[#D4AF37] border-[#D4AF37] shadow-xl shadow-[#D4AF37]/30 -translate-y-2'
                    : 'bg-white border-gray-200 shadow-md hover:shadow-lg'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 50}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-500 ${
                    hoveredIndex === index ? 'bg-[#111827] scale-110' : 'bg-[#D4AF37]/10'
                  }`}
                >
                  <Icon
                    className={`w-6 h-6 transition-colors duration-500 ${
                      hoveredIndex === index ? 'text-[#D4AF37]' : 'text-[#D4AF37]'
                    }`}
                  />
                </div>

                <h3
                  className={`font-semibold text-lg mb-3 transition-colors duration-500 ${
                    hoveredIndex === index ? 'text-[#111827]' : 'text-[#111827]'
                  }`}
                >
                  {item.title}
                </h3>

                <p
                  className={`text-sm leading-relaxed transition-colors duration-500 ${
                    hoveredIndex === index ? 'text-[#111827]/80' : 'text-gray-600'
                  }`}
                >
                  {item.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
