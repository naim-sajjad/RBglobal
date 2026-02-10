"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  ArrowRight,
  Building2,
  Sparkles,
} from "lucide-react"

export default function FeaturedJobs() {
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

  const jobs = [
    {
      id: 1,
      title: "Senior Software Engineer",
      company: "TechCorp Solutions",
      logo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&h=100&fit=crop",
      location: "Toronto, ON",
      type: "Full-time",
      salary: "$120K - $150K",
      posted: "2 days ago",
      tags: ["React", "Node.js", "TypeScript"],
      featured: true,
    },
    {
      id: 2,
      title: "Data Analyst",
      company: "Analytics Pro",
      logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop",
      location: "Vancouver, BC",
      type: "Full-time",
      salary: "$85K - $105K",
      posted: "3 days ago",
      tags: ["Python", "SQL", "Tableau"],
      featured: false,
    },
    {
      id: 3,
      title: "UX/UI Designer",
      company: "Creative Studio",
      logo: "https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=100&h=100&fit=crop",
      location: "Remote",
      type: "Contract",
      salary: "$70K - $90K",
      posted: "1 week ago",
      tags: ["Figma", "Adobe XD", "Prototyping"],
      featured: true,
    },
    {
      id: 4,
      title: "DevOps Engineer",
      company: "CloudScale Inc",
      logo: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=100&h=100&fit=crop",
      location: "Montreal, QC",
      type: "Full-time",
      salary: "$110K - $140K",
      posted: "5 days ago",
      tags: ["AWS", "Docker", "Kubernetes"],
      featured: false,
    },
    {
      id: 5,
      title: "Product Manager",
      company: "InnovateTech",
      logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=100&h=100&fit=crop",
      location: "Calgary, AB",
      type: "Full-time",
      salary: "$95K - $125K",
      posted: "4 days ago",
      tags: ["Agile", "Scrum", "Strategy"],
      featured: false,
    },
    {
      id: 6,
      title: "Cybersecurity Analyst",
      company: "SecureNet",
      logo: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100&h=100&fit=crop",
      location: "Ottawa, ON",
      type: "Full-time",
      salary: "$100K - $130K",
      posted: "1 day ago",
      tags: ["Security", "SIEM", "Compliance"],
      featured: true,
    },
  ]

  return (
    <section ref={sectionRef} className="py-24 bg-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-40 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl" />
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
            <Sparkles className="w-4 h-4" />
            Featured Jobs
          </span>
          <h2
            className={`text-4xl md:text-5xl font-bold text-[#111827] mb-6 transition-all duration-700 delay-100 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Find the <span className="text-[#D4AF37]">Right Job</span>. Right Now.
          </h2>
          <p
            className={`text-gray-600 text-lg max-w-2xl mx-auto transition-all duration-700 delay-200 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Your search is over - discover your dream job from our curated listings
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <div
              key={job.id}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl border border-gray-100 transition-all duration-500 hover:-translate-y-2 overflow-hidden ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Featured badge */}
              {job.featured && (
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#D4AF37] text-[#111827] text-xs font-bold rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                </div>
              )}

              {/* Company Logo & Info */}
              <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-2 ring-gray-100 group-hover:ring-[#D4AF37]/30 transition-all">
                  <img
                    src={job.logo || "/placeholder.svg"}
                    alt={job.company}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[#111827] group-hover:text-[#D4AF37] transition-colors truncate text-lg">
                    {job.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Building2 className="w-4 h-4" />
                    {job.company}
                  </div>
                </div>
              </div>

              {/* Job Details */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  {job.location}
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                    {job.type}
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-[#111827]">
                    <DollarSign className="w-4 h-4 text-[#D4AF37]" />
                    {job.salary}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#111827]/5 text-[#111827] text-xs font-medium rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">{job.posted}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-[#D4AF37]/10 text-gray-400 hover:text-[#D4AF37] transition-colors"
                    aria-label="Save job"
                  >
                    <Bookmark className="w-5 h-5" />
                  </button>
                  <Button
                    size="sm"
                    className="bg-[#111827] hover:bg-[#D4AF37] text-white hover:text-[#111827] rounded-lg transition-all duration-300"
                  >
                    Apply
                  </Button>
                </div>
              </div>

              {/* Hover border effect */}
              <div className={`absolute inset-0 border-2 rounded-2xl transition-colors pointer-events-none ${
                hoveredIndex === index ? "border-[#D4AF37]/50" : "border-transparent"
              }`} />
            </div>
          ))}
        </div>

        {/* Browse All Button */}
        <div
          className={`text-center mt-14 transition-all duration-700 delay-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Button
            size="lg"
            className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white rounded-full px-10 py-7 text-lg font-semibold shadow-xl shadow-[#D4AF37]/20 transition-all duration-300 hover:scale-105 group"
          >
            Browse All Jobs
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
