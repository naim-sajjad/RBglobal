"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, MapPin, Briefcase, ChevronDown, TrendingUp } from "lucide-react"

export default function JobSearch() {
  const [isVisible, setIsVisible] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const categories = [
    "All Categories",
    "Software Development",
    "IT & Networking",
    "Data Science",
    "Healthcare IT",
    "Security",
    "Project Management",
  ]

  const popularSearches = [
    "Software Developer",
    "Data Analyst",
    "Project Manager",
    "IT Support",
  ]

  return (
    <section ref={sectionRef} className="py-20 bg-white relative">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(#111827 1px, transparent 1px), linear-gradient(90deg, #111827 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 relative">
        <div
          className={`max-w-5xl mx-auto transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* Search Card */}
          <div className="bg-[#111827] rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            {/* Animated corner accent */}
            <div className="absolute top-0 left-0 w-32 h-32">
              <div className="absolute top-4 left-4 w-16 h-1 bg-[#D4AF37] rounded-full" />
              <div className="absolute top-4 left-4 w-1 h-16 bg-[#D4AF37] rounded-full" />
            </div>

            <div className="relative">
              <div className="text-center mb-10">
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Find Your Perfect Job
                </h3>
                <p className="text-white/60 text-lg">
                  Search through thousands of job listings at GenNextGlobalTech
                </p>
              </div>

              {/* Search Form */}
              <div className="grid md:grid-cols-12 gap-4">
                {/* Keywords */}
                <div className={`md:col-span-4 relative transition-transform duration-300 ${focusedInput === 'keyword' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <Search className="w-5 h-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Job title or keyword"
                    onFocus={() => setFocusedInput('keyword')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-16 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:bg-white/15 transition-all"
                  />
                </div>

                {/* Location */}
                <div className={`md:col-span-3 relative transition-transform duration-300 ${focusedInput === 'location' ? 'scale-[1.02]' : ''}`}>
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Location"
                    onFocus={() => setFocusedInput('location')}
                    onBlur={() => setFocusedInput(null)}
                    className="pl-12 h-16 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#D4AF37] focus:ring-[#D4AF37]/30 focus:bg-white/15 transition-all"
                  />
                </div>

                {/* Category Dropdown */}
                <div className="md:col-span-3 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full h-16 pl-12 pr-10 text-left rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 hover:border-[#D4AF37] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all flex items-center"
                  >
                    <span
                      className={
                        selectedCategory ? "text-white" : "text-white/40"
                      }
                    >
                      {selectedCategory || "Category"}
                    </span>
                    <ChevronDown
                      className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 transition-transform duration-300 ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(
                              category === "All Categories" ? "" : category
                            )
                            setIsDropdownOpen(false)
                          }}
                          className="w-full px-4 py-3 text-left text-[#111827] hover:bg-[#D4AF37]/10 hover:text-[#111827] transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search Button */}
                <div className="md:col-span-2">
                  <Button className="w-full h-16 bg-[#D4AF37] hover:bg-[#B8962E] text-[#111827] font-bold rounded-xl text-lg shadow-lg shadow-[#D4AF37]/30 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                    <Search className="w-5 h-5 md:mr-2 group-hover:rotate-12 transition-transform" />
                    <span className="hidden md:inline">Search</span>
                  </Button>
                </div>
              </div>

              {/* Popular searches */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 text-sm text-white/50">
                  <TrendingUp className="w-4 h-4" />
                  Trending:
                </span>
                {popularSearches.map((term, index) => (
                  <button
                    key={term}
                    type="button"
                    className={`text-sm px-4 py-2 rounded-full bg-white/10 text-white/70 hover:bg-[#D4AF37] hover:text-[#111827] transition-all duration-300 hover:scale-105 ${
                      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                    }`}
                    style={{ transitionDelay: `${600 + index * 100}ms` }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
