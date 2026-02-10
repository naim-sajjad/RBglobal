"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X, Phone, Mail, MapPin } from "lucide-react"

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { name: "Home", href: "#" },
    { name: "About Us", href: "#about" },
    { name: "Recruitment Services", href: "#services" },
    { name: "Job Seekers", href: "#jobs" },
    { name: "Employer", href: "#employers" },
    { name: "Contact Us", href: "#contact" },
  ]

  return (
    <>
      {/* Top Bar */}
      <div className="bg-[#111827] text-white py-2 px-4 hidden md:block">
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              +1 647-438-2755
            </span>
            <span className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              info@gennextglobaltech.ca
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              Mississauga, ON L4Z 2Z1
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-[#D4AF37] transition-colors">
              Register
            </Link>
            <Link href="#" className="hover:text-[#D4AF37] transition-colors">
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors duration-300">
                <span className="text-[#D4AF37] group-hover:text-[#111827] font-bold text-xl transition-colors">GN</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-xl text-[#111827]">GenNextGlobalTech</span>
                <span className="block text-xs text-gray-500">Empowering Careers</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[#111827] hover:text-[#D4AF37] transition-colors font-medium relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37] transition-all duration-300 group-hover:w-full" />
                </Link>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                className="border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white rounded-full px-6 transition-all duration-300 bg-transparent"
              >
                Post a Job
              </Button>
              <Button className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white rounded-full px-6 font-semibold transition-all duration-300">
                Find Jobs
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="lg:hidden p-2 text-[#111827]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              isMobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
            }`}
          >
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[#111827] hover:text-[#D4AF37] transition-colors font-medium py-2 px-4 rounded-lg hover:bg-[#D4AF37]/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 px-4">
                <Button
                  variant="outline"
                  className="border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white w-full rounded-full bg-transparent"
                >
                  Post a Job
                </Button>
                <Button className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white font-semibold w-full rounded-full">
                  Find Jobs
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  )
}
