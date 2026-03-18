"use client"

import { useEffect, useState } from "react"

export default function CourseIntro() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    })
    const element = document.getElementById("course-intro")
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="course-intro" className="py-16 md:py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <div className={`transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}>
          <p className="text-lg text-gray-700 leading-relaxed text-center">
            Are you ready to take control of your career journey and achieve the growth and success you've always dreamed of? At GenNextGlobalTech Ltd., we understand that climbing the corporate ladder or making a successful career transition can be challenging. That's why we've designed our Career Growth Course to equip you with the skills and knowledge you need to excel at every stage of your professional life. Our comprehensive program covers a wide range of topics to ensure you're fully prepared for whatever your career throws your way:
          </p>
        </div>
      </div>
    </section>
  )
}
