'use client'

import { useEffect, useRef, useState } from 'react'

export default function ChooseClassifications() {
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

  const categories = [
    'All Categories',
    'IT Specialist',
    'Help Desk',
    'Network',
    'Database',
    'System Administrator',
    'Software Developer',
    'Cloud Architect',
    'IT Training',
    'Bihar',
    'All Locations',
    'System Analyst',
    'Software Developer',
    'Data Management',
    'System Analyst',
    'Software Quality Management',
    'Software Management',
    'Security Analyst/Architect',
    'Network',
    'IT Project',
    'IT Management',
    'IT Executive',
    'IT Coordinator',
    'IT Audit',
    'IT Intern',
    'Business Intelligence',
    'Healthcare IT',
    'Geographic IT',
    'Game Development',
    'Cyber Security',
  ]

  return (
    <section ref={sectionRef} className="py-24 bg-gradient-to-b from-white to-[#F8F8F8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
            Choose your Classifications!
          </h2>
          <p className="text-gray-600">Select your areas of expertise</p>
        </div>

        {/* Categories Grid */}
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-500 border-2 hover:-translate-y-1 ${
                category === 'All Categories'
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-[#111827] border-[#111827] hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111827]'
              } ${
                isVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: isVisible ? `${(index % 10) * 30}ms` : '0ms' }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-32 right-4 w-48 h-48 bg-[#D4AF37]/5 rounded-full blur-2xl -z-10" />
        <div className="absolute bottom-32 left-4 w-48 h-48 bg-[#3B82F6]/5 rounded-full blur-2xl -z-10" />
      </div>
    </section>
  )
}
