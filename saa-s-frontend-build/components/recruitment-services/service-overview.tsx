'use client'

import { useState, useEffect, useRef } from 'react'
import { Handshake, Briefcase, CheckCircle2 } from 'lucide-react'

export default function ServiceOverview() {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredTab, setHoveredTab] = useState<'employer' | 'candidate'>('employer')
  const sectionRef = useRef(null)

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

  const employerServices = [
    {
      title: 'Why GenNext Global Tech?',
      description: 'We are an IT recruitment company providing talent for a full spectrum of IT positions. We take pride in matching the right talent to the right position.',
    },
    {
      title: 'Contract',
      label: 'GenNext Global Tech',
      description: 'contract with GenNext Global Tech is a great way to fill short-term positions while evaluating the individual for long-term positions.',
    },
    {
      title: 'Permanent',
      label: 'GenNext Global Tech',
      description: 'can help you free up your valuable time by sourcing well-qualified employees for your long-term organizational needs.',
    },
    {
      title: 'Project Based',
      label: 'GenNext Global Tech',
      description: 'can help you staff your short-term, long-term, and multi-year projects with the right level of staff.',
    },
    {
      title: 'Whether its needed expertise',
      description: 'we will source the right talent for you so you can focus on your organization\'s vision and mission.',
    },
  ]

  const candidateServices = [
    {
      title: 'Why GenNext Global Tech?',
      description: 'Your search is over - let GenNext Global Tech recruiting team about your skills and you dream job.',
    },
    {
      title: 'Remote',
      label: 'GenNext Global Tech',
      description: 'understands that flexibility in terms of remote work has never been more available and this is what for IT roles partners than any other industry.',
    },
    {
      title: 'Contract',
      label: 'GenNext Global Tech',
      description: 'Not sure if you are ready for a permanent role and to settle into a long-term career? Try GenNext Global Tech contract-based work to find the right fit.',
    },
    {
      title: 'Permanent',
      label: 'GenNext Global Tech',
      description: 'find you the right long-term career option for you in the perfect position.',
    },
  ]

  const services = hoveredTab === 'employer' ? employerServices : candidateServices

  return (
    <section ref={sectionRef} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="flex justify-center gap-8 mb-16">
          <button
            onClick={() => setHoveredTab('employer')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 ${
              hoveredTab === 'employer'
                ? 'bg-[#111827] text-[#D4AF37] shadow-lg'
                : 'bg-white text-[#111827] border-2 border-[#111827] hover:border-[#D4AF37]'
            }`}
          >
            <Briefcase className="w-6 h-6" />
            EMPLOYER SERVICES
          </button>
          <button
            onClick={() => setHoveredTab('candidate')}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-500 ${
              hoveredTab === 'candidate'
                ? 'bg-[#111827] text-[#D4AF37] shadow-lg'
                : 'bg-white text-[#111827] border-2 border-[#111827] hover:border-[#D4AF37]'
            }`}
          >
            <Handshake className="w-6 h-6" />
            CANDIDATE SERVICES
          </button>
        </div>

        {/* Content */}
        <div className={`transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            {/* Left - Description */}
            <div className="space-y-6">
              {services.slice(0, 3).map((service, index) => (
                <div
                  key={`${hoveredTab}-${index}`}
                  className="animate-fade-in"
                  style={{
                    animation: isVisible ? `fadeInUp 0.6s ease-out ${index * 0.1}s both` : 'none',
                  }}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#D4AF37] text-[#111827]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#111827] mb-2">
                        {service.title}
                        {service.label && <span className="text-[#D4AF37]"> - {service.label}</span>}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right - Additional Content */}
            <div className="space-y-6">
              {services.slice(3).map((service, index) => (
                <div
                  key={`${hoveredTab}-right-${index}`}
                  className="animate-fade-in"
                  style={{
                    animation: isVisible ? `fadeInUp 0.6s ease-out ${(index + 3) * 0.1}s both` : 'none',
                  }}
                >
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#D4AF37] text-[#111827]">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#111827] mb-2">
                        {service.title}
                        {service.label && <span className="text-[#D4AF37]"> - {service.label}</span>}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  )
}
