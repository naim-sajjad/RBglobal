'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Instagram, Facebook, Globe } from 'lucide-react'

const projects = [
  {
    image: 'https://images.unsplash.com/photo-1609042231012-fa0986ce1a2c?w=300&h=300&fit=crop',
    title: 'THE CREATION OF PURE VELVET',
    description:
      'We brainstormed, researched, and collaborated extensively to create the perfect name, packaging, and design for our client\'s product',
    icon: Instagram,
  },
  {
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop',
    title: 'MY LONG HAIR OIL REBRAND',
    description:
      'We transformed our client\'s product from dark packaging to bright, conveying a fresh and natural look to match its key selling points.',
    icon: Facebook,
  },
  {
    image: 'https://images.unsplash.com/photo-1572365992253-3cb3e56dd362?w=300&h=300&fit=crop',
    title: 'THE CREATION OF PAIN BE GONE',
    description:
      'We brainstormed, researched, and collaborated extensively to create the perfect name, packaging, and design for our client\'s product',
    icon: Globe,
  },
]

export default function TheProject() {
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
    <section ref={ref} className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-[#111827] text-center mb-16">The Project</h2>

        <div className="space-y-8">
          {projects.map((project, index) => {
            const Icon = project.icon
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group flex flex-col md:flex-row gap-6 p-6 rounded-xl transition-all duration-500 ${
                  hoveredIndex === index
                    ? 'bg-[#D4AF37]/10 border-2 border-[#D4AF37]'
                    : 'bg-white border-2 border-transparent'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="w-full md:w-48 h-48 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src={project.image}
                    alt={project.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#111827] mb-2 uppercase tracking-wide">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{project.description}</p>

                  {/* Border accent */}
                  <div
                    className={`h-1 w-0 bg-[#D4AF37] transition-all duration-500 group-hover:w-12`}
                  />
                </div>

                {/* Icon */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37]/10 flex-shrink-0 transition-all duration-500 group-hover:bg-[#D4AF37] group-hover:scale-110">
                  <Icon className="w-8 h-8 text-[#D4AF37] group-hover:text-[#111827] transition-colors" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
