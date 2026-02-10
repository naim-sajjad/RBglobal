"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, ChevronLeft, ChevronRight, Briefcase, Users, Building2, Trophy } from "lucide-react"

const slides = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1920&q=80",
    badge: "Over 3,000+ Jobs Available",
    title: "Find Your",
    highlight: "Dream",
    titleEnd: "Career",
    description: "Connect with top employers and discover opportunities that match your skills. Your next career move starts with GenNextGlobalTech.",
    primaryBtn: "Search Jobs",
    secondaryBtn: "Post a Job",
    icon: Briefcase,
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80",
    badge: "Top Talent Pool",
    title: "Hire",
    highlight: "Exceptional",
    titleEnd: "Talent",
    description: "Access thousands of qualified candidates ready to contribute to your organization's success through GenNextGlobalTech.",
    primaryBtn: "Find Candidates",
    secondaryBtn: "Learn More",
    icon: Users,
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80",
    badge: "230+ Companies Trust Us",
    title: "Partner With",
    highlight: "Leading",
    titleEnd: "Companies",
    description: "Join hundreds of forward-thinking companies who have found their perfect team members through GenNextGlobalTech.",
    primaryBtn: "View Companies",
    secondaryBtn: "Become Partner",
    icon: Building2,
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1920&q=80",
    badge: "Success Stories",
    title: "Achieve Your",
    highlight: "Career",
    titleEnd: "Goals",
    description: "Thousands of professionals have transformed their careers with GenNextGlobalTech. Be the next success story.",
    primaryBtn: "Get Started",
    secondaryBtn: "Read Stories",
    icon: Trophy,
  },
]

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [direction, setDirection] = useState<"left" | "right">("right")

  const goToSlide = useCallback((index: number, dir: "left" | "right") => {
    if (isAnimating) return
    setIsAnimating(true)
    setDirection(dir)
    setCurrentSlide(index)
    setTimeout(() => setIsAnimating(false), 700)
  }, [isAnimating])

  const nextSlide = useCallback(() => {
    const next = (currentSlide + 1) % slides.length
    goToSlide(next, "right")
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    const prev = (currentSlide - 1 + slides.length) % slides.length
    goToSlide(prev, "left")
  }, [currentSlide, goToSlide])

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000)
    return () => clearInterval(interval)
  }, [nextSlide])

  const slide = slides[currentSlide]
  const IconComponent = slide.icon

  return (
    <section className="relative h-[100vh] min-h-[700px] overflow-hidden bg-[#111827]">
      {/* Background Slides */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${s.image}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-[#111827]/50" />
        </div>
      ))}

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-[#D4AF37] via-[#D4AF37]/50 to-transparent" />
        
        {/* Geometric shapes */}
        <div className="absolute top-20 right-[20%] w-64 h-64 border border-[#3B82F6]/20 rounded-full animate-spin-slow" />
        <div className="absolute top-40 right-[25%] w-40 h-40 border border-[#D4AF37]/20 rounded-full animate-spin-slow-reverse" />
        <div className="absolute bottom-40 right-[15%] w-20 h-20 bg-[#D4AF37]/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-[30%] right-[10%] w-32 h-32 bg-[#3B82F6]/10 rounded-full blur-2xl animate-pulse delay-1000" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative h-full container mx-auto px-4 flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
          {/* Left Content */}
          <div className="relative z-10">
            {/* Badge */}
            <div 
              className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37]/20 to-[#3B82F6]/20 backdrop-blur-sm border border-white/10 mb-8 transition-all duration-500 ${
                isAnimating ? (direction === "right" ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10") : "opacity-100 translate-x-0"
              }`}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]" />
              </span>
              <span className="text-white/90 text-sm font-medium tracking-wide">
                {slide.badge}
              </span>
            </div>

            {/* Main Heading */}
            <h1 
              className={`text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-[1.1] transition-all duration-500 delay-100 ${
                isAnimating ? (direction === "right" ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10") : "opacity-100 translate-x-0"
              }`}
            >
              {slide.title}{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#D4AF37] to-[#F0D78C] bg-clip-text text-transparent">
                  {slide.highlight}
                </span>
                <svg
                  className="absolute -bottom-2 left-0 w-full h-3"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden="true"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 10C50 4 150 4 198 10"
                    stroke="url(#underline-gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="underline-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <br />
              {slide.titleEnd}
            </h1>

            {/* Description */}
            <p 
              className={`text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-xl transition-all duration-500 delay-200 ${
                isAnimating ? (direction === "right" ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10") : "opacity-100 translate-x-0"
              }`}
            >
              {slide.description}
            </p>

            {/* CTA Buttons */}
            <div 
              className={`flex flex-col sm:flex-row gap-4 transition-all duration-500 delay-300 ${
                isAnimating ? (direction === "right" ? "opacity-0 -translate-x-10" : "opacity-0 translate-x-10") : "opacity-100 translate-x-0"
              }`}
            >
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#B8962E] hover:to-[#D4AF37] text-[#111827] text-lg px-8 py-6 rounded-xl shadow-2xl shadow-[#D4AF37]/25 transition-all duration-300 hover:scale-105 hover:shadow-[#D4AF37]/40 group font-semibold"
              >
                {slide.primaryBtn}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-[#3B82F6]/50 text-white hover:bg-[#3B82F6]/20 hover:border-[#3B82F6] text-lg px-8 py-6 rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105 bg-transparent"
              >
                {slide.secondaryBtn}
              </Button>
            </div>

            {/* Quick Stats */}
            <div 
              className={`flex items-center gap-8 mt-12 pt-8 border-t border-white/10 transition-all duration-500 delay-400 ${
                isAnimating ? "opacity-0" : "opacity-100"
              }`}
            >
              {[
                { value: "890+", label: "Active Jobs" },
                { value: "3.1K+", label: "Candidates" },
                { value: "230+", label: "Companies" },
              ].map((stat) => (
                <div key={stat.label} className="text-center sm:text-left">
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-white/50 text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Floating Card */}
          <div className="hidden lg:flex justify-center items-center">
            <div 
              className={`relative transition-all duration-700 ${
                isAnimating ? "opacity-0 scale-90" : "opacity-100 scale-100"
              }`}
            >
              {/* Main floating card */}
              <div className="relative w-80 h-80 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-8 flex flex-col items-center justify-center shadow-2xl">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B8962E] flex items-center justify-center mb-6 shadow-lg shadow-[#D4AF37]/30">
                  <IconComponent className="w-12 h-12 text-[#111827]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 text-center">{slide.highlight}</h3>
                <p className="text-white/60 text-center text-sm">{slide.titleEnd}</p>
                
                {/* Decorative dots */}
                <div className="absolute -top-4 -right-4 w-8 h-8 rounded-full bg-[#3B82F6] animate-bounce" />
                <div className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-[#D4AF37] animate-bounce delay-500" />
              </div>

              {/* Orbiting elements */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-[#3B82F6] text-white text-sm font-medium shadow-lg animate-float">
                New Jobs Daily
              </div>
              <div className="absolute -bottom-6 right-0 px-4 py-2 rounded-full bg-white text-[#111827] text-sm font-medium shadow-lg animate-float delay-1000">
                Quick Apply
              </div>
              <div className="absolute top-1/2 -left-12 -translate-y-1/2 px-4 py-2 rounded-full bg-[#D4AF37] text-[#111827] text-sm font-medium shadow-lg animate-float delay-500">
                Top Employers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="absolute bottom-1/2 translate-y-1/2 left-4 right-4 flex justify-between pointer-events-none z-20">
        <button
          onClick={prevSlide}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-[#111827] transition-all duration-300 pointer-events-auto group"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
        <button
          onClick={nextSlide}
          className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-[#D4AF37] hover:border-[#D4AF37] hover:text-[#111827] transition-all duration-300 pointer-events-auto group"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index, index > currentSlide ? "right" : "left")}
            className={`relative h-2 rounded-full transition-all duration-500 overflow-hidden ${
              index === currentSlide ? "w-12 bg-[#D4AF37]" : "w-2 bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentSlide && (
              <span 
                className="absolute inset-0 bg-gradient-to-r from-[#3B82F6] to-[#D4AF37] origin-left"
                style={{
                  animation: "progress 6s linear forwards",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-8 right-8 text-white/60 font-mono text-sm z-20">
        <span className="text-[#D4AF37] font-bold text-lg">{String(currentSlide + 1).padStart(2, "0")}</span>
        <span className="mx-2">/</span>
        <span>{String(slides.length).padStart(2, "0")}</span>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes progress {
          from {
            transform: scaleX(0);
          }
          to {
            transform: scaleX(1);
          }
        }
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes spin-slow-reverse {
          from {
            transform: rotate(360deg);
          }
          to {
            transform: rotate(0deg);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 30s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 25s linear infinite;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  )
}
