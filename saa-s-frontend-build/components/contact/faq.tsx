"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: "What services does GenNextGlobalTech offer?",
      answer:
        "We provide comprehensive recruitment services, managed IT services, and career growth courses designed to help individuals and businesses succeed.",
    },
    {
      question: "How quickly can you fulfill my recruitment needs?",
      answer:
        "We understand the urgency of hiring. Our team works diligently to source and present qualified candidates within 2-4 weeks, depending on the position's requirements.",
    },
    {
      question: "Do you offer customized training programs?",
      answer:
        "Yes! Our Career Growth Course is fully customizable. We tailor the curriculum to meet individual needs and corporate training requirements.",
    },
    {
      question: "What is your response time for inquiries?",
      answer:
        "We aim to respond to all inquiries within 24 business hours. For urgent matters, please call us directly at +1 647-438-2755.",
    },
    {
      question: "Can I schedule a consultation?",
      answer:
        "Absolutely! We offer free consultations to discuss your needs. Please fill out the contact form or call us to schedule a meeting.",
    },
    {
      question: "What is your cancellation policy?",
      answer:
        "Our policies vary depending on the service. Please contact us directly to discuss specific details and terms for your situation.",
    },
  ]

  return (
    <div className="py-16 bg-white">
      <div className="mx-auto w-full max-w-[1600px] px-5 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111827] mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Find answers to common questions about our services and how we can help you.
            </p>
          </div>

          <div className="space-y-4 animate-fade-in-up delay-100">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-[#D4AF37] transition-all duration-300"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full p-6 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                >
                  <h3 className="text-left font-semibold text-[#111827]">{faq.question}</h3>
                  <ChevronDown
                    className={`w-5 h-5 text-[#D4AF37] flex-shrink-0 transition-transform duration-300 ${
                      openIndex === index ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-6 bg-gray-50 border-t-2 border-gray-200 animate-fade-in">
                    <p className="text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 p-8 bg-gradient-to-r from-[#111827] to-[#1a2332] rounded-2xl text-center animate-fade-in-up delay-200">
            <h3 className="text-white text-2xl font-bold mb-3">Didn't find what you're looking for?</h3>
            <p className="text-white/70 mb-6">
              Our team is here to help. Contact us directly for personalized assistance.
            </p>
            <a
              href="mailto:info@gennextglobaltech.ca"
              className="inline-block px-8 py-3 bg-[#D4AF37] text-[#111827] rounded-lg font-semibold hover:bg-white transition-all duration-300 hover:scale-105"
            >
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
