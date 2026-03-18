"use client"

import { useEffect, useRef, useState } from "react"
import { Star } from "lucide-react"

const testimonials = [
  {
    name: "Gabriel Lambert",
    content:
      "Thanks to them, our online sales soared with their E-commerce PPC expertise. The results exceeded our expectations.",
    rating: 5,
  },
  {
    name: "Emmanuel Alonso",
    content:
      "Global Tech revolutionized our lead generation with B2B PPC. Their targeted leads have fueled our growth. Highly recommended for their PPC expertise!",
    rating: 5,
  },
  {
    name: "Ishita Khatri",
    content:
      "Our PPC campaigns improved dramatically with automation and optimization. More efficient and consistently better results.",
    rating: 5,
  },
]

export default function PPCTestimonials() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.15 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <h2
          className={`text-3xl md:text-4xl font-bold text-center text-[#111827] mb-14 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          What Our <span className="text-[#3B82F6]">Clients Say</span>
        </h2>

        {/* Testimonial cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((item, index) => (
            <div
              key={item.name}
              className={`relative bg-[#d0dff0] rounded-2xl p-8 transition-all duration-700 hover:shadow-lg ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-[#111827]/80 leading-relaxed mb-6 text-sm">
                {item.content}
              </p>

              {/* Name */}
              <p className="font-bold text-[#111827]">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
