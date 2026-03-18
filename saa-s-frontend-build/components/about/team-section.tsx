"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Linkedin, Mail } from "lucide-react"

export default function TeamSection() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const teamMembers = [
    {
      name: "Diverse Team",
      role: "Expert Professionals",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop",
    },
    {
      name: "Global Network",
      role: "Worldwide Presence",
      image: "https://images.unsplash.com/photo-1553531088-34c1e8e1d0ae?w=400&h=400&fit=crop",
    },
    {
      name: "Dedicated Support",
      role: "Your Success Partner",
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop",
    },
  ]

  return (
    <section ref={ref} className="py-20 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            <span className="text-[#D4AF37] font-semibold text-sm tracking-widest uppercase">Our Team</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-6">
            Driven by Excellence
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Our diverse team of recruitment experts is committed to delivering exceptional results for our partners and candidates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={member.name}
              className={`group relative transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="relative">
                {/* Image container */}
                <div className="relative h-80 rounded-2xl overflow-hidden mb-6 shadow-lg group-hover:shadow-2xl group-hover:shadow-[#D4AF37]/30 transition-all duration-500">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-[#111827]/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <div className="flex gap-4">
                      <button className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#111827] flex items-center justify-center hover:scale-110 transition-transform">
                        <Linkedin className="w-5 h-5" />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#111827] flex items-center justify-center hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info card */}
                <div className="bg-gradient-to-br from-[#111827] to-[#1a2332] rounded-2xl p-6 border-2 border-[#111827] group-hover:border-[#D4AF37] transition-all duration-500">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#D4AF37] transition-colors">
                    {member.name}
                  </h3>
                  <p className="text-[#D4AF37] font-semibold">{member.role}</p>

                  {/* Animated underline */}
                  <div className="h-1 w-0 bg-gradient-to-r from-[#D4AF37] to-[#3B82F6] mt-4 group-hover:w-8 transition-all duration-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
