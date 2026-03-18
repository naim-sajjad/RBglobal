'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
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
    <section ref={sectionRef} className="relative py-24 overflow-hidden">
      {/* Two Column Background */}
      <div className="absolute inset-0 grid grid-cols-2">
        <div
          className="opacity-50"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div
          className="opacity-50"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1522071820081-014c2d435cde?w=600&h=600&fit=crop')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      </div>

      {/* Dark Overlays */}
      <div className="absolute inset-0 grid grid-cols-2">
        <div className="bg-gradient-to-r from-[#111827] to-[#111827]/70" />
        <div className="bg-gradient-to-l from-[#111827] to-[#111827]/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Employer CTA */}
          <div
            className={`text-white text-center transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'
            }`}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">I'm an</h3>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">EMPLOYER</h2>
            <p className="text-white/80 mb-8 max-w-sm mx-auto">
              Signed in companies are able to post new job offers, searching for candidates or hiring the professionals for your organization.
            </p>
            <Button className="bg-white text-[#111827] hover:bg-[#D4AF37] rounded-full px-8 py-6 font-bold flex items-center gap-2 mx-auto transition-all duration-300">
              <span>Register as Company</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Candidate CTA */}
          <div
            className={`text-white text-center transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'
            }`}
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">I'm a</h3>
            <h2 className="text-5xl md:text-6xl font-bold mb-6">CANDIDATE</h2>
            <p className="text-white/80 mb-8 max-w-sm mx-auto">
              Browse and search potential candidates for your perfect match you seek job to earn your income and establish your career path.
            </p>
            <Button className="bg-white text-[#111827] hover:bg-[#D4AF37] rounded-full px-8 py-6 font-bold flex items-center gap-2 mx-auto transition-all duration-300">
              <span>Register as Candidate</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
