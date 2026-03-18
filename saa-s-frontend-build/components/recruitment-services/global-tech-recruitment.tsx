'use client'

import { useEffect, useRef, useState } from 'react'

export default function GlobalTechRecruitment() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

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

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-white via-[#F8F8F8] to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-10 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-0 w-96 h-96 bg-[#3B82F6]/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          {/* Decorative Line */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-1 w-12 bg-[#D4AF37] rounded-full" />
            <div className="h-2 w-2 bg-[#111827] rounded-full" />
            <div className="h-1 w-12 bg-[#D4AF37] rounded-full" />
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-8">
            Global Tech Recruitment
          </h2>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed mb-12">
            GenNext Global Tech provides outstanding results for our clients by applying the industry's most innovative and effective approaches to recruitment services and HR consulting. We're committed to connecting top talent with exceptional opportunities in the tech industry.
          </p>

          {/* Three Pillars */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {[
              {
                number: '01',
                title: 'Innovative Approach',
                description: 'Cutting-edge recruitment strategies tailored to your specific needs',
              },
              {
                number: '02',
                title: 'Expert Team',
                description: 'Experienced professionals with deep industry knowledge and connections',
              },
              {
                number: '03',
                title: 'Results Driven',
                description: 'Focused on delivering exceptional outcomes and lasting partnerships',
              },
            ].map((pillar, index) => (
              <div
                key={index}
                className={`group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border-2 border-transparent hover:border-[#D4AF37] ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
              >
                {/* Animated Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative">
                  <div className="text-5xl font-bold text-[#D4AF37] mb-4">{pillar.number}</div>
                  <h3 className="text-xl font-bold text-[#111827] mb-3">{pillar.title}</h3>
                  <p className="text-gray-600">{pillar.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
