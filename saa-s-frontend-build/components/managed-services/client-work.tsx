'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const clientWorks = [
  {
    title: 'Pure Velvet Branding',
    image: 'https://images.unsplash.com/photo-1609042231012-fa0986ce1a2c?w=300&h=300&fit=crop',
  },
  {
    title: 'Hair Care Product',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&h=300&fit=crop',
  },
  {
    title: 'Label Design Project',
    image: 'https://images.unsplash.com/photo-1572365992253-3cb3e56dd362?w=300&h=300&fit=crop',
  },
]

export default function ClientWork() {
  const [isVisible, setIsVisible] = useState(false)
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
        <h2 className="text-4xl md:text-5xl font-bold text-[#111827] text-center mb-16">Client Work</h2>

        <div className="grid md:grid-cols-3 gap-8">
          {clientWorks.map((work, index) => (
            <div
              key={index}
              className={`group overflow-hidden rounded-lg transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative h-64 overflow-hidden rounded-lg">
                <Image
                  src={work.image}
                  alt={work.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <p className="text-white font-semibold text-lg">{work.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
