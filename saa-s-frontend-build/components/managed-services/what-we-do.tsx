'use client'

import { useEffect, useRef, useState } from 'react'

export default function WhatWeDo() {
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
        <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-6">What We Do</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            At GenNextGlobalTech Ltd, we are dedicated to elevating your online presence and driving exceptional results. Our tailored digital marketing strategies are designed to connect your brand with your target audience, amplify your message, and generate tangible growth. With a proven track record of success, we've empowered numerous clients to achieve remarkable results in a matter of days.
          </p>
        </div>
      </div>
    </section>
  )
}
