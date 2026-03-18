"use client"

import { useEffect, useState } from "react"
import { FileText, Users, BookOpen, Award, Network, MessageSquare, Briefcase, Laptop } from "lucide-react"

const modules = [
  {
    title: "Resume Building",
    description: "Crafting an attention-grabbing resume is your first step towards career success. Our course will teach you the art of creating a compelling resume that highlights your skills and experiences effectively.",
    icon: FileText,
    color: "#3B82F6",
  },
  {
    title: "Interview Preparation",
    description: "Nail your interviews with confidence! We provide you with the tools and techniques to ace interviews, from answering tough questions to mastering body language.",
    icon: Users,
    color: "#3B82F6",
  },
  {
    title: "Professional Resignation Strategies",
    description: "Sometimes, a change in career direction is necessary. Learn how to resign from your job gracefully and professionally without burning bridges.",
    icon: BookOpen,
    color: "#3B82F6",
  },
  {
    title: "Personal Branding",
    description: "Define your unique personal brand and learn how to showcase it to stand out in your field.",
    icon: Award,
    color: "#3B82F6",
  },
  {
    title: "Networking Skills",
    description: "Building a strong professional network is essential in today's competitive job market. Discover how to connect with industry professionals, mentors, and potential employers.",
    icon: Network,
    color: "#3B82F6",
  },
  {
    title: "Effective Communication",
    description: "Develop strong communication skills to convey your ideas, negotiate effectively, and handle workplace conflicts with finesse.",
    icon: MessageSquare,
    color: "#3B82F6",
  },
  {
    title: "Leadership and Management",
    description: "Whether you're an aspiring leader or aiming for a managerial role, we provide insights and tools to help you become an effective and inspiring leader.",
    icon: Briefcase,
    color: "#3B82F6",
  },
  {
    title: "Continuous Learning and Growth",
    description: "In the ever-evolving professional landscape, continuous learning is key. Discover how to stay updated and relevant in your industry.",
    icon: Laptop,
    color: "#3B82F6",
  },
]

export default function CourseModules() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
      }
    })
    const element = document.getElementById("course-modules")
    if (element) observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="course-modules" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Grid of Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module, index) => {
            const IconComponent = module.icon
            return (
              <div
                key={module.title}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative bg-white rounded-2xl p-8 border border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                  isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${200 + index * 50}ms` }}
              >
                {/* Hover background */}
                <div className={`absolute inset-0 bg-[#111827] transition-all duration-500 ${
                  hoveredIndex === index ? "opacity-100" : "opacity-0"
                }`} />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-all duration-500 ${
                    hoveredIndex === index 
                      ? "bg-[#D4AF37] scale-110" 
                      : "bg-[#3B82F6]/10"
                  }`}>
                    <IconComponent className={`w-8 h-8 transition-colors duration-500 ${
                      hoveredIndex === index ? "text-[#111827]" : "text-[#3B82F6]"
                    }`} />
                  </div>

                  {/* Title */}
                  <h3 className={`font-bold text-lg mb-3 transition-colors duration-500 ${
                    hoveredIndex === index ? "text-white" : "text-[#111827]"
                  }`}>
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-sm leading-relaxed transition-colors duration-500 ${
                    hoveredIndex === index ? "text-white/80" : "text-gray-600"
                  }`}>
                    {module.description}
                  </p>
                </div>

                {/* Decorative corner */}
                <div className={`absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-[#D4AF37]/20 transition-all duration-500 ${
                  hoveredIndex === index ? "scale-150 opacity-100" : "scale-100 opacity-0"
                }`} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
