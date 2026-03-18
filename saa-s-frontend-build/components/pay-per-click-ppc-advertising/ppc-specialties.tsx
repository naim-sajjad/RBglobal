"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

const specialties = [
  {
    title: "E-commerce PPC",
    image: "/images/ppc-ecommerce.jpg",
    description:
      "Drive targeted traffic to your online store with expertly managed e-commerce PPC campaigns that maximize ROI and boost sales.",
  },
  {
    title: "B2B Lead Generation via PPC",
    image: "/images/ppc-b2b-lead.jpg",
    description:
      "Generate high-quality B2B leads through strategic PPC campaigns tailored to reach decision-makers in your target industries.",
  },
  {
    title: "PPC Automation and Optimization",
    image: "/images/ppc-automation.jpg",
    description:
      "Leverage cutting-edge automation tools and data-driven optimization to enhance campaign performance and reduce costs.",
  },
]

export default function PPCSpecialties() {
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
          Our <span className="text-[#3B82F6]">Specialties</span>
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {specialties.map((item, index) => (
            <div
              key={item.title}
              className={`group transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              {/* Image */}
              <div className="relative h-56 rounded-xl overflow-hidden shadow-lg border border-gray-100">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/70 to-transparent" />
                <h3 className="absolute bottom-4 left-4 right-4 text-white font-bold text-lg">
                  {item.title}
                </h3>
              </div>

              {/* Read More */}
              <div className="mt-3 text-center">
                <Link
                  href="#"
                  className="text-[#3B82F6] hover:text-[#D4AF37] text-sm font-medium transition-colors"
                >
                  Read More
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
