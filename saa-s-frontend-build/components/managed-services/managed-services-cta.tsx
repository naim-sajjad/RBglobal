'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export default function ManagedServicesCTA() {
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
      { threshold: 0.3 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="relative py-20 bg-gradient-to-r from-[#111827] to-[#111827]/95 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#D4AF37]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <p className="text-white/80 mb-4 text-lg">Ready to elevate your digital presence with us today?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Contact us today and plan a free consultation to discuss how we can help you achieve remarkable results, and like we did for our clients. Let's chart your path to new heights together!
          </h2>

          <Button className="bg-[#3B82F6] hover:bg-[#D4AF37] text-white hover:text-[#111827] px-8 py-3 rounded-full font-semibold transition-all duration-300 text-lg">
            CONTACT US
          </Button>
        </div>
      </div>
    </section>
  )
}
