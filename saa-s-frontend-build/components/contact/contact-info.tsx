"use client"

import { Phone, Mail, MapPin, Clock } from "lucide-react"
import Link from "next/link"

export default function ContactInfo() {
  const contactDetails = [
    {
      icon: Phone,
      title: "Phone",
      value: "+1 647-438-2755",
      href: "tel:+16474382755",
      color: "text-[#D4AF37]",
    },
    {
      icon: Mail,
      title: "Email",
      value: "info@gennextglobaltech.ca",
      href: "mailto:info@gennextglobaltech.ca",
      color: "text-[#3B82F6]",
    },
    {
      icon: MapPin,
      title: "Address",
      value: "5802-25 Watline Avenue, Mississauga, ON L4Z 2Z1",
      href: "#",
      color: "text-[#D4AF37]",
    },
    {
      icon: Clock,
      title: "Hours",
      value: "Mon - Fri: 9:00 AM - 6:00 PM EST",
      href: "#",
      color: "text-[#3B82F6]",
    },
  ]

  return (
    <div className="animate-fade-in-up delay-100">
      <div className="mb-8 relative">
        <div className="absolute -left-4 top-0 w-1 h-12 bg-gradient-to-b from-[#D4AF37] to-transparent rounded-full" />
        <h2 className="text-3xl font-bold text-[#111827] mb-2">Quick Contact</h2>
        <p className="text-gray-600">Reach out using any of these methods</p>
      </div>

      <div className="space-y-3">
        {contactDetails.map((detail, index) => (
          <a
            key={detail.title}
            href={detail.href}
            className="group block p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-xl hover:border-[#D4AF37] hover:from-[#D4AF37]/5 hover:to-white hover:shadow-lg transition-all duration-300 relative overflow-hidden"
            style={{ transitionDelay: `${index * 50}ms` }}
          >
            {/* Animated background accent */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/0 to-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className={`flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-[#D4AF37]/10 to-[#3B82F6]/5 flex items-center justify-center group-hover:from-[#D4AF37] group-hover:to-[#D4AF37] transition-all duration-300 border border-[#D4AF37]/20`}>
                <detail.icon className={`w-7 h-7 text-[#D4AF37] group-hover:text-white transition-colors duration-300`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  <h3 className="font-semibold text-[#111827] text-sm">{detail.title}</h3>
                </div>
                <p className="text-gray-700 text-sm break-all group-hover:text-[#D4AF37] transition-colors font-medium">
                  {detail.value}
                </p>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="text-[#D4AF37] text-lg">→</div>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Social Links */}
      <div className="mt-10 pt-8 border-t-2 border-gray-200 relative">
        <div className="absolute -left-4 top-0 w-1 h-12 bg-gradient-to-b from-[#3B82F6] to-transparent rounded-full" />
        <h3 className="font-semibold text-[#111827] mb-5 text-sm uppercase tracking-widest">Follow Our Journey</h3>
        <div className="flex gap-3 flex-wrap">
          {[
            { name: "Facebook", href: "#", icon: "f", color: "from-blue-600 to-blue-500" },
            { name: "LinkedIn", href: "#", icon: "in", color: "from-blue-700 to-blue-600" },
            { name: "Twitter", href: "#", icon: "x", color: "from-sky-500 to-sky-400" },
            { name: "Instagram", href: "#", icon: "ig", color: "from-pink-500 to-orange-400" },
          ].map((social) => (
            <a
              key={social.name}
              href={social.href}
              className={`w-13 h-13 rounded-lg bg-gradient-to-br from-[#111827] to-[#1a2a3a] flex items-center justify-center text-white hover:from-[#D4AF37] hover:to-[#B8962E] hover:text-[#111827] transition-all duration-300 hover:scale-125 hover:shadow-xl text-xs font-bold relative group border border-[#D4AF37]/30`}
              aria-label={social.name}
              title={social.name}
            >
              <span className="relative z-10">{social.icon}</span>
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#D4AF37]/20 blur transition-opacity" />
            </a>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-4">Connect with us on social media for updates and insights</p>
      </div>
    </div>
  )
}
