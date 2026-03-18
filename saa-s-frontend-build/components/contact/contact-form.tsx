"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, CheckCircle } from "lucide-react"

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setFormData({ name: "", email: "", phone: "", company: "", subject: "", message: "" })
  }

  return (
    <div className="animate-fade-in-up">
      <div className="mb-12">
        <h2 className="text-4xl font-bold text-[#111827] mb-3">Send us a Message</h2>
        <p className="text-gray-600">Fill out the form below and our team will get back to you within 24 hours.</p>
      </div>

      {submitted && (
        <div className="mb-8 p-5 bg-emerald-50 border-l-4 border-emerald-500 rounded-lg flex items-center gap-4 animate-fade-in">
          <div className="flex-shrink-0 w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-emerald-900 font-semibold">Message sent successfully!</p>
            <p className="text-emerald-700 text-sm">We'll be in touch soon.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gradient-to-br from-white to-gray-50 p-8 md:p-10 rounded-2xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
        {/* Decorative corner elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#3B82F6]/3 rounded-full -ml-20 -mb-20 blur-3xl" />
        
        {/* Form content with relative positioning */}
        <div className="relative z-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#D4AF37] rounded-full" />
              Full Name <span className="text-[#D4AF37]">*</span>
            </label>
            <div className="relative">
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="h-12 bg-white border-2 border-gray-300 text-[#111827] placeholder:text-gray-400 rounded-lg focus:bg-blue-50/10 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all group-hover:border-gray-400"
              />
            </div>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#3B82F6] rounded-full" />
              Email Address <span className="text-[#D4AF37]">*</span>
            </label>
            <div className="relative">
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john@example.com"
                className="h-12 bg-white border-2 border-gray-300 text-[#111827] placeholder:text-gray-400 rounded-lg focus:bg-blue-50/10 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all group-hover:border-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="group">
            <label className="block text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#D4AF37] rounded-full" />
              Phone Number
            </label>
            <div className="relative">
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 647-438-2755"
                className="h-12 bg-white border-2 border-gray-300 text-[#111827] placeholder:text-gray-400 rounded-lg focus:bg-blue-50/10 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all group-hover:border-gray-400"
              />
            </div>
          </div>
          <div className="group">
            <label className="block text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <span className="w-1 h-4 bg-[#3B82F6] rounded-full" />
              Company Name
            </label>
            <div className="relative">
              <Input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your Company"
                className="h-12 bg-white border-2 border-gray-300 text-[#111827] placeholder:text-gray-400 rounded-lg focus:bg-blue-50/10 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all group-hover:border-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#D4AF37] rounded-full" />
            Subject <span className="text-[#D4AF37]">*</span>
          </label>
          <select
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full h-12 bg-white border-2 border-gray-300 text-[#111827] rounded-lg focus:bg-blue-50/10 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all px-4 appearance-none cursor-pointer group-hover:border-gray-400"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23111827' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
            }}
          >
            <option value="">Select a subject</option>
            <option value="recruitment">Recruitment Services</option>
            <option value="managed">Managed Services</option>
            <option value="career">Career Growth Course</option>
            <option value="general">General Inquiry</option>
            <option value="partnership">Partnership Opportunity</option>
          </select>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-[#3B82F6] rounded-full" />
            Message <span className="text-[#D4AF37]">*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            placeholder="Tell us how we can help..."
            rows={6}
            className="w-full bg-white border-2 border-gray-300 text-[#111827] placeholder:text-gray-400 rounded-lg focus:bg-blue-50/10 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 transition-all p-4 resize-none group-hover:border-gray-400"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-14 bg-gradient-to-r from-[#D4AF37] to-[#B8962E] hover:from-[#111827] hover:to-[#1a2a3a] text-[#111827] hover:text-white rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-2xl border border-[#D4AF37] hover:border-[#111827]"
        >
          <span className="relative">
            Send Message
            <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform inline-block ml-2" />
          </span>
        </Button>
        </div>
      </form>
    </div>
  )
}
