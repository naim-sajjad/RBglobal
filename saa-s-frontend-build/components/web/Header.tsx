'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileDropdown, setMobileDropdown] = useState<string | null>(null);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Recruitment Services', href: '#services' },
    {
      name: 'Job Seekers',
      href: '#jobs',
      submenu: [
        { name: 'Driver registration', href: '/driver/register' },
        { name: 'Browse Jobs', href: '#jobs' },
        { name: 'Job Alerts', href: '#jobs' },
        { name: 'Career Resources', href: '#jobs' },
        { name: 'Resume Builder', href: '#jobs' },
        { name: 'Interview Tips', href: '#jobs' },
      ],
    },
    {
      name: 'Employer',
      href: '#employers',
      submenu: [
        { name: 'Post a Job', href: '#employers' },
        { name: 'Browse Candidates', href: '#employers' },
        { name: 'Recruitment Solutions', href: '#employers' },
        { name: 'Pricing Plans', href: '#employers' },
        { name: 'Employer Dashboard', href: '#employers' },
      ],
    },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <>
      {/* Top Bar */}
      <div className='bg-[#111827] text-white py-2 px-4 hidden md:block'>
        <div className='container mx-auto flex justify-between items-center text-sm'>
          <div className='flex items-center gap-6'>
            <span className='flex items-center gap-2'>
              <Phone className='w-4 h-4 text-[#D4AF37]' />
              +1 647-438-2755
            </span>
            <span className='flex items-center gap-2'>
              <Mail className='w-4 h-4 text-[#D4AF37]' />
              info@gennextglobaltech.ca
            </span>
            <span className='flex items-center gap-2'>
              <MapPin className='w-4 h-4 text-[#D4AF37]' />
              Mississauga, ON L4Z 2Z1
            </span>
          </div>
          <div className='flex items-center gap-4'>
            <Link
              href='/driver/register'
              className='hover:text-[#D4AF37] transition-colors'
            >
              Register
            </Link>
            <Link
              href='/login'
              className='hover:text-[#D4AF37] transition-colors'
            >
              Login
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-lg'
            : 'bg-white/80 backdrop-blur-sm'
        }`}
      >
        <div className='container mx-auto px-4'>
          <div className='flex items-center justify-between h-16 md:h-20'>
            {/* Logo */}
            <Link href='/' className='flex items-center gap-3 group'>
              <div className='w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center group-hover:bg-[#D4AF37] transition-colors duration-300'>
                <span className='text-[#D4AF37] group-hover:text-[#111827] font-bold text-xl transition-colors'>
                  GN
                </span>
              </div>
              <div className='hidden sm:block'>
                <span className='font-bold text-xl text-[#111827]'>
                  GenNextGlobalTech
                </span>
                <span className='block text-xs text-gray-500'>
                  Empowering Careers
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className='hidden lg:flex items-center gap-8'>
              {navLinks.map((link) =>
                link.submenu ? (
                  <div
                    key={link.name}
                    className='relative'
                    onMouseEnter={() => setOpenDropdown(link.name)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type='button'
                      className='cursor-pointer flex items-center gap-1 text-[#111827] hover:text-[#D4AF37] transition-colors font-medium relative group'
                    >
                      {link.name}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          openDropdown === link.name ? 'rotate-180' : ''
                        }`}
                      />
                      <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37] transition-all duration-300 group-hover:w-full' />
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={`absolute top-full left-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 overflow-hidden transition-all duration-200 origin-top ${
                        openDropdown === link.name
                          ? 'opacity-100 scale-y-100 translate-y-0'
                          : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
                      }`}
                    >
                      <div className='py-2'>
                        {link.submenu.map((sub) => (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className='flex items-center px-5 py-2.5 text-sm text-[#111827] hover:bg-[#D4AF37]/10 hover:text-[#D4AF37] transition-colors font-medium'
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                      <div className='h-1 bg-[#D4AF37]' />
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className='text-[#111827] hover:text-[#D4AF37] transition-colors font-medium relative group'
                  >
                    {link.name}
                    <span className='absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D4AF37] transition-all duration-300 group-hover:w-full' />
                  </Link>
                ),
              )}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className='hidden lg:flex items-center gap-3'>
              <Button
                variant='outline'
                className='border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white rounded-full px-6 transition-all duration-300 bg-transparent'
              >
                Post a Job
              </Button>
              <Button className='bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white rounded-full px-6 font-semibold transition-all duration-300'>
                Find Jobs
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type='button'
              className='lg:hidden p-2 text-[#111827]'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label='Toggle mobile menu'
            >
              {isMobileMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ${
              isMobileMenuOpen ? 'max-h-[600px] pb-4' : 'max-h-0'
            }`}
          >
            <nav className='flex flex-col gap-1'>
              {navLinks.map((link) =>
                link.submenu ? (
                  <div key={link.name}>
                    <button
                      type='button'
                      className='flex items-center justify-between w-full text-[#111827] hover:text-[#D4AF37] transition-colors font-medium py-2 px-4 rounded-lg hover:bg-[#D4AF37]/10'
                      onClick={() =>
                        setMobileDropdown(
                          mobileDropdown === link.name ? null : link.name,
                        )
                      }
                    >
                      {link.name}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          mobileDropdown === link.name ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-200 ${
                        mobileDropdown === link.name ? 'max-h-64' : 'max-h-0'
                      }`}
                    >
                      {link.submenu.map((sub) => (
                        <Link
                          key={sub.name}
                          href={sub.href}
                          className='block text-sm text-[#111827] hover:text-[#D4AF37] transition-colors font-medium py-2 pl-8 pr-4 rounded-lg hover:bg-[#D4AF37]/10'
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setMobileDropdown(null);
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className='text-[#111827] hover:text-[#D4AF37] transition-colors font-medium py-2 px-4 rounded-lg hover:bg-[#D4AF37]/10'
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ),
              )}
              <div className='flex flex-col gap-2 mt-4 px-4'>
                <Button
                  variant='outline'
                  className='border-2 border-[#111827] text-[#111827] hover:bg-[#111827] hover:text-white w-full rounded-full bg-transparent'
                >
                  Post a Job
                </Button>
                <Button className='bg-[#D4AF37] hover:bg-[#111827] text-[#111827] hover:text-white font-semibold w-full rounded-full'>
                  Find Jobs
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
