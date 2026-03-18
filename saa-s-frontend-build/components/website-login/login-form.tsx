"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Facebook,
  Twitter,
  Linkedin,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-[#111827] via-[#1a2332] to-[#111827] overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-[#D4AF37]/5 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-[#3B82F6]/5 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-10 group">
          <div className="w-14 h-14 rounded-xl bg-[#D4AF37] flex items-center justify-center group-hover:bg-white transition-colors duration-300">
            <span className="text-[#111827] font-bold text-2xl">GN</span>
          </div>
          <div>
            <span className="font-bold text-2xl text-white">GenNextGlobalTech</span>
            <span className="block text-xs text-white/60">Empowering Careers</span>
          </div>
        </Link>

        {/* Login Card */}
        <div className="w-full max-w-md">
          {/* Card Header */}
          <div className="bg-[#D4AF37] rounded-t-2xl px-8 py-6 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-[#111827]">
              Login to your account
            </h1>
          </div>

          {/* Card Body */}
          <div className="bg-white rounded-b-2xl shadow-2xl shadow-black/30 px-8 py-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-xs font-bold tracking-widest uppercase text-[#D4AF37]"
                >
                  User Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B82F6]" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter Your Username or Email."
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14 border-2 border-gray-200 rounded-xl text-[#111827] placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-xs font-bold tracking-widest uppercase text-[#D4AF37]"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3B82F6]" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-12 pr-12 h-14 border-2 border-gray-200 rounded-xl text-[#111827] placeholder:text-gray-400 focus:border-[#D4AF37] focus:ring-[#D4AF37]/20 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#111827] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-14 bg-[#111827] hover:bg-[#D4AF37] text-white hover:text-[#111827] rounded-xl font-bold text-lg tracking-wide transition-all duration-300 shadow-lg shadow-[#111827]/30 hover:shadow-[#D4AF37]/30"
              >
                LOGIN
              </Button>
            </form>

            {/* Lost Password */}
            <div className="text-center mt-5">
              <Link
                href="#"
                className="text-[#3B82F6] hover:text-[#D4AF37] font-medium transition-colors"
              >
                Lost Password?
              </Link>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="w-10 h-10 rounded-full bg-[#111827] text-white flex items-center justify-center text-sm font-semibold">
                Or
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Social Login Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center gap-3 bg-[#3b5998] hover:bg-[#2d4373] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Facebook className="w-6 h-6" />
                <span className="text-sm">FACEBOOK</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 bg-[#db4437] hover:bg-[#c23321] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Mail className="w-6 h-6" />
                <span className="text-sm">GOOGLE</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 bg-[#1DA1F2] hover:bg-[#0d8ddb] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02] col-start-1 col-end-2 sm:col-start-auto sm:col-end-auto"
              >
                <Twitter className="w-6 h-6" />
                <span className="text-sm">TWITTER</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-3 bg-[#0077B5] hover:bg-[#005e8e] text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-300 hover:scale-[1.02]"
              >
                <Linkedin className="w-6 h-6" />
                <span className="text-sm">LINKEDIN</span>
              </button>
            </div>

            {/* Register Link */}
            <div className="text-center mt-8">
              <p className="text-gray-500">
                {"Don't have an account? "}
                <Link
                  href="#"
                  className="text-[#3B82F6] hover:text-[#D4AF37] font-semibold transition-colors"
                >
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 md:gap-10 text-white/70 text-sm">
          <a
            href="tel:+16474382755"
            className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors"
          >
            <Phone className="w-4 h-4 text-[#D4AF37]" />
            +1 647-438-2755
          </a>
          <a
            href="mailto:info@gennextglobaltech.ca"
            className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors"
          >
            <Mail className="w-4 h-4 text-[#D4AF37]" />
            info@gennextglobaltech.ca
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            Mississauga, ON L4Z 2Z1
          </span>
        </div>
      </div>
    </section>
  )
}
