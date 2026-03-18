'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, User, Send, FileText, Users, Handshake } from 'lucide-react'

export default function HowItWorks() {
  const [isVisible, setIsVisible] = useState(false)
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

  const jobSeekerSteps = [
    {
      icon: Search,
      title: 'Start your search',
      description: 'Register and update your resume with GenNext Global Tech as a Candidate, start your search to apply for any position relevant to your interest.',
    },
    {
      icon: User,
      title: 'Receive tailored job recommendations',
      description: 'Discover curated job opportunities that align with your skills and priorities, ensuring you stay exceptional and avoid missing on valuable opportunities.',
    },
    {
      icon: Send,
      title: "We're on your side",
      description: 'Our experts advocate for you with hiring managers, ensuring they recognize you fit for the position, and manage your salary negotiations.',
    },
  ]

  const employerSteps = [
    {
      icon: FileText,
      title: 'Post a job for free',
      description: 'Submit your job details and GenNext Global Tech will provide you with a qualified candidate pool for your position.',
    },
    {
      icon: Users,
      title: 'Get your shortlist',
      description: 'GenNext Global Tech will carry out pre-screening and provide you with interview-ready candidates who are a good fit for your position.',
    },
    {
      icon: Handshake,
      title: 'Conduct interviews',
      description: 'Select top picks to interview with GenNext Global Tech will arrange face or telephonic interview with the selected candidates.',
    },
    {
      icon: User,
      title: 'Hire Talent',
      description: 'Close the deal and add new members to your team from GenNext Global Tech talented talent pool of candidates.',
    },
  ]

  return (
    <section ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">How it Works</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our streamlined process ensures a smooth experience for both job seekers and employers
          </p>
        </div>

        {/* For Job Seekers */}
        <div className="mb-20">
          <h3 className={`text-3xl font-bold text-[#111827] mb-10 text-center transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            For Job Seekers
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {jobSeekerSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  className={`group relative bg-[#111827] text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-[#111827] hover:border-[#D4AF37] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={{ transitionDelay: isVisible ? `${index * 100}ms` : '0ms' }}
                >
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37] text-[#111827] mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-8 h-8" />
                    </div>

                    <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                    <p className="text-white/80">{step.description}</p>

                    {/* Step Number */}
                    <div className="absolute top-6 right-6 text-5xl font-bold text-white/10 group-hover:text-[#D4AF37]/20 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* For Employers */}
        <div>
          <h3 className={`text-3xl font-bold text-[#111827] mb-10 text-center transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            For Employers
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {employerSteps.map((step, index) => {
              const Icon = step.icon
              return (
                <div
                  key={index}
                  className={`group relative bg-[#111827] text-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-2 border-[#111827] hover:border-[#D4AF37] ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                  }`}
                  style={{ transitionDelay: isVisible ? `${(jobSeekerSteps.length + index) * 100}ms` : '0ms' }}
                >
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#D4AF37] text-[#111827] mb-6 group-hover:scale-110 transition-transform duration-500">
                      <Icon className="w-8 h-8" />
                    </div>

                    <h4 className="text-xl font-bold mb-3">{step.title}</h4>
                    <p className="text-white/80 text-sm">{step.description}</p>

                    {/* Step Number */}
                    <div className="absolute top-6 right-6 text-5xl font-bold text-white/10 group-hover:text-[#D4AF37]/20 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
