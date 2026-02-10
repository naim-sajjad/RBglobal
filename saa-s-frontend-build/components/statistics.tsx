"use client"

import { useEffect, useRef, useState } from "react"
import { Briefcase, FileText, Building2, CheckCircle } from "lucide-react"

function AnimatedCounter({
  target,
  duration = 2000,
  isVisible,
}: {
  target: number
  duration?: number
  isVisible: boolean
}) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * target))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration, isVisible])

  return <span>{count.toLocaleString()}</span>
}

export default function Statistics() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const stats = [
    {
      icon: Briefcase,
      value: 890,
      suffix: "+",
      label: "Jobs Available",
    },
    {
      icon: FileText,
      value: 3120,
      suffix: "+",
      label: "Active Resumes",
    },
    {
      icon: Building2,
      value: 230,
      suffix: "+",
      label: "Employers",
    },
    {
      icon: CheckCircle,
      value: 150,
      suffix: "+",
      label: "Positions Matched",
    },
  ]

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[#111827]" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        
        {/* Decorative lines */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section title */}
        <div className={`text-center mb-16 transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Join the GenNextGlobalTech community and be part of our growing success
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`text-center group transition-all duration-700 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + index * 150}ms` }}
            >
              {/* Icon */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#D4AF37]/10 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-[#D4AF37]/20 group-hover:rotate-3">
                <stat.icon className="w-10 h-10 text-[#D4AF37]" />
              </div>

              {/* Counter */}
              <div className="text-5xl md:text-6xl font-bold text-white mb-3">
                <AnimatedCounter
                  target={stat.value}
                  isVisible={isVisible}
                  duration={2000}
                />
                <span className="text-[#D4AF37]">{stat.suffix}</span>
              </div>

              {/* Label */}
              <p className="text-white/60 font-medium text-lg">{stat.label}</p>

              {/* Decorative line */}
              <div
                className={`h-1 w-0 mx-auto mt-6 rounded-full bg-[#D4AF37] transition-all duration-1000 ${
                  isVisible ? "w-16" : "w-0"
                }`}
                style={{
                  transitionDelay: `${800 + index * 150}ms`,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
