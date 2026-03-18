"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export default function CourseCTA() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    })
    const element = document.getElementById("course-cta")
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="course-cta"
      className="py-16 md:py-24 bg-gradient-to-r from-[#111827] via-[#1a2332] to-[#111827]"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className={`text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-white/70 text-lg mb-10 max-w-2xl mx-auto">
            Elevate your professional journey with our comprehensive Career Growth Course. Enroll today and take the first step towards achieving your career goals.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 group">
              Enroll Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-[#111827] rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300"
            >
              Learn More
            </Button>
          </div>

          {/* Additional Info */}
          <p className="text-white/60 text-sm mt-10">
            Questions? Contact our team at{" "}
            <a href="mailto:info@gennextglobaltech.ca" className="text-[#D4AF37] hover:underline">
              info@gennextglobaltech.ca
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
