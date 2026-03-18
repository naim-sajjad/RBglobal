"use client"

import { Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PPCCTA() {
  return (
    <section className="py-16 bg-gradient-to-br from-[#111827] via-[#1a2332] to-[#111827] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-1/4 w-80 h-80 rounded-full bg-[#D4AF37]/5 blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-1/3 w-72 h-72 rounded-full bg-[#3B82F6]/5 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to <span className="text-[#D4AF37]">Boost</span> Your Business?
          </h2>
          <p className="text-white/70 mb-8 leading-relaxed">
            Get in touch with our PPC experts today and start driving measurable results for your business.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link href="/contact">
              <Button className="bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-[#D4AF37] border-2 border-[#D4AF37] rounded-full px-8 py-3 font-semibold transition-all duration-300">
                Contact Us
              </Button>
            </Link>
            <Link href="tel:+16474382755">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#111827] rounded-full px-8 py-3 font-semibold transition-all duration-300 bg-transparent">
                Call Now
              </Button>
            </Link>
          </div>

          {/* Contact bar */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-white/70 text-sm">
            <a href="tel:+16474382755" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              +1 647-438-2755
            </a>
            <a href="mailto:info@gennextglobaltech.ca" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors">
              <Mail className="w-4 h-4 text-[#D4AF37]" />
              info@gennextglobaltech.ca
            </a>
            <span className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF37]" />
              Mississauga, ON L4Z 2Z1
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
