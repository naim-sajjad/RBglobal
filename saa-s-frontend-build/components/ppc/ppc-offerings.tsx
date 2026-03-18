"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"

const offeringsRow1 = [
  {
    title: "Customized PPC Strategy",
    image: "/images/ppc-strategy.jpg",
  },
  {
    title: "Keyword Research and Selection",
    image: "/images/ppc-keyword.jpg",
  },
  {
    title: "Ad Campaign Creation",
    image: "/images/ppc-ad-campaign.jpg",
  },
  {
    title: "Ad Placement and Targeting",
    image: "/images/ppc-ad-placement.jpg",
  },
]

const offeringsRow2 = [
  {
    title: "Budget Management",
    image: "/images/ppc-budget.jpg",
  },
  {
    title: "A/B Testing",
    image: "/images/ppc-ab-testing.jpg",
  },
  {
    title: "Conversion Tracking",
    image: "/images/ppc-conversion.jpg",
  },
]

export default function PPCOfferings() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 bg-[#f9fafb]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <div className="text-center mb-14">
          <h2
            className={`text-3xl md:text-4xl font-bold text-[#111827] mb-4 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            What We <span className="text-[#3B82F6]">Can Offer You</span>
          </h2>
          <p
            className={`text-gray-600 max-w-2xl mx-auto leading-relaxed transition-all duration-700 delay-100 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            We offer a range of services and expertise to help businesses or individuals effectively manage their social media presence and achieve their marketing goals.
          </p>
        </div>

        {/* Row 1 - 4 items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-8">
          {offeringsRow1.map((item, index) => (
            <OfferingCard
              key={item.title}
              item={item}
              index={index}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* Row 2 - 3 items centered */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[780px] mx-auto">
          {offeringsRow2.map((item, index) => (
            <OfferingCard
              key={item.title}
              item={item}
              index={index + 4}
              isVisible={isVisible}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function OfferingCard({
  item,
  index,
  isVisible,
}: {
  item: { title: string; image: string }
  index: number
  isVisible: boolean
}) {
  return (
    <div
      className={`group transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Image card */}
      <div className="relative h-52 rounded-xl overflow-hidden shadow-md border border-gray-100">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/70 to-transparent" />
        <h3 className="absolute bottom-4 left-4 right-4 text-white font-semibold text-sm leading-snug">
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
  )
}
