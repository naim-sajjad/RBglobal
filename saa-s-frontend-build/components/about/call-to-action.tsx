"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"

export default function CallToAction() {
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

  return (
    <section ref={ref} className="py-20 bg-gradient-to-r from-[#111827] to-[#1a2332] relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#D4AF37]/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[#3B82F6]/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          className={`text-center transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Partner with <span className="text-[#D4AF37]">GenNextGlobalTech?</span>
          </h2>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Whether you're an employer seeking top IT talent or a professional ready to advance your career, let's connect and explore the possibilities.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group relative inline-flex items-center justify-center px-8 py-4 bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-[#D4AF37] rounded-full font-bold transition-all duration-300 overflow-hidden">
              <span className="relative flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button className="group relative inline-flex items-center justify-center px-8 py-4 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#111827] rounded-full font-bold transition-all duration-300">
              <span className="flex items-center gap-2">
                Schedule a Call
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Contact info */}
          <div className="mt-16 pt-12 border-t border-white/20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="group">
                <p className="text-[#D4AF37] font-semibold mb-2 group-hover:text-white transition-colors">Email</p>
                <p className="text-white/80 group-hover:text-white transition-colors">info@gennextglobaltech.ca</p>
              </div>
              <div className="group">
                <p className="text-[#D4AF37] font-semibold mb-2 group-hover:text-white transition-colors">Phone</p>
                <p className="text-white/80 group-hover:text-white transition-colors">+1 (647) 258-7752</p>
              </div>
              <div className="group">
                <p className="text-[#D4AF37] font-semibold mb-2 group-hover:text-white transition-colors">Location</p>
                <p className="text-white/80 group-hover:text-white transition-colors">Mississauga, ON L5J 2T7</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
