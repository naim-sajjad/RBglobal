"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Briefcase, Star, ArrowRight, ExternalLink, Users } from "lucide-react"

export default function FeaturedCandidates() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const candidates = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Senior Software Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      location: "Toronto, ON",
      experience: "8 years",
      rating: 4.9,
      skills: ["React", "Python", "AWS"],
      available: true,
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Data Scientist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      location: "Vancouver, BC",
      experience: "6 years",
      rating: 4.8,
      skills: ["Machine Learning", "Python", "TensorFlow"],
      available: true,
    },
    {
      id: 3,
      name: "Emily Davis",
      role: "Product Designer",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      location: "Montreal, QC",
      experience: "5 years",
      rating: 4.7,
      skills: ["Figma", "UI/UX", "Prototyping"],
      available: false,
    },
    {
      id: 4,
      name: "David Kim",
      role: "DevOps Engineer",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
      location: "Calgary, AB",
      experience: "7 years",
      rating: 4.9,
      skills: ["Kubernetes", "Docker", "CI/CD"],
      available: true,
    },
    {
      id: 5,
      name: "Jessica Martinez",
      role: "Marketing Manager",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      location: "Ottawa, ON",
      experience: "9 years",
      rating: 4.6,
      skills: ["SEO", "Analytics", "Strategy"],
      available: true,
    },
    {
      id: 6,
      name: "James Wilson",
      role: "Full Stack Developer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      location: "Edmonton, AB",
      experience: "4 years",
      rating: 4.8,
      skills: ["Next.js", "Node.js", "PostgreSQL"],
      available: true,
    },
  ]

  return (
    <section ref={sectionRef} className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] text-sm font-semibold mb-6 transition-all duration-700 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <Users className="w-4 h-4" />
            Top Talent
          </span>
          <h2
            className={`text-4xl md:text-5xl font-bold text-[#111827] mb-6 transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Featured Candidates
          </h2>
          <p
            className={`text-gray-600 text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Connect with skilled professionals ready to join your team
          </p>
        </div>

        {/* Candidates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((candidate, index) => (
            <div
              key={candidate.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Availability badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    candidate.available
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {candidate.available ? "Available" : "Busy"}
                </span>
              </div>

              {/* Avatar & Info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-4">
                  <div className={`w-24 h-24 rounded-full overflow-hidden ring-4 transition-all duration-500 ${
                    hoveredIndex === index ? "ring-[#D4AF37]/40 scale-105" : "ring-[#D4AF37]/10"
                  }`}>
                    <img
                      src={candidate.avatar || "/placeholder.svg"}
                      alt={candidate.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 bg-white rounded-full shadow-lg border border-gray-100">
                    <Star className="w-3 h-3 text-[#D4AF37] fill-[#D4AF37]" />
                    <span className="text-xs font-bold text-[#111827]">
                      {candidate.rating}
                    </span>
                  </div>
                </div>

                <h3 className="font-bold text-lg text-[#111827] group-hover:text-[#D4AF37] transition-colors">
                  {candidate.name}
                </h3>
                <p className="text-[#D4AF37] font-medium text-sm">
                  {candidate.role}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-5">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  {candidate.location}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                  {candidate.experience} experience
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-[#111827]/5 text-[#111827] text-xs font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <Button
                className="w-full bg-[#111827] hover:bg-[#D4AF37] text-white hover:text-[#111827] rounded-xl transition-all duration-300 group-hover:shadow-lg"
              >
                View Profile
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>

              {/* Hover border effect */}
              <div className={`absolute inset-0 border-2 rounded-2xl transition-colors pointer-events-none ${
                hoveredIndex === index ? "border-[#D4AF37]/50" : "border-transparent"
              }`} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div
          className={`text-center mt-14 transition-all duration-700 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white rounded-full px-10 py-7 text-lg font-semibold transition-all duration-300 hover:scale-105 group bg-transparent"
          >
            All Candidates
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
