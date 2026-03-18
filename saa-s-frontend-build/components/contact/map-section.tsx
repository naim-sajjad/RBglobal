"use client"

import { MapPin } from "lucide-react"

export default function MapSection() {
  return (
    <div className="w-full py-16 bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
            Visit Our Office
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Located in the heart of Mississauga, we're ready to welcome you to our modern offices.
          </p>
        </div>

        <div className="relative h-96 rounded-2xl overflow-hidden shadow-xl animate-fade-in-up delay-100">
          {/* Placeholder Map */}
          <div className="w-full h-full bg-gradient-to-br from-[#111827] to-[#1a2332] flex flex-col items-center justify-center relative">
            {/* Google Maps Embed would go here */}
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 rounded-full bg-[#D4AF37] flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MapPin className="w-10 h-10 text-[#111827]" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">GenNextGlobalTech</h3>
              <p className="text-white/70 text-sm">
                5802-25 Watline Avenue
                <br />
                Mississauga, ON L4Z 2Z1, Canada
              </p>
              <a
                href="https://maps.google.com/?q=5802-25+Watline+Avenue+Mississauga+ON"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 px-6 py-2 bg-[#D4AF37] text-[#111827] rounded-lg font-semibold hover:bg-white transition-all duration-300"
              >
                Open in Maps
              </a>
            </div>
          </div>
        </div>

        {/* Office Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {[
            { label: "Modern Facilities", value: "State-of-the-art offices" },
            { label: "Easy Access", value: "Close to major transit" },
            { label: "Welcoming Team", value: "Ready to serve you" },
          ].map((item, index) => (
            <div
              key={item.label}
              className="p-6 bg-white border-2 border-gray-100 rounded-xl text-center hover:border-[#D4AF37] transition-all duration-300 animate-fade-in-up"
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              <h3 className="font-semibold text-[#111827] mb-2">{item.label}</h3>
              <p className="text-gray-600">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
