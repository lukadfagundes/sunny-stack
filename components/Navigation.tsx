'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Code2, User, Briefcase, FileText, Mail, Menu, X } from 'lucide-react'

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navItems = [
    { href: '/', label: 'Home', icon: Code2 },
    { href: '/about', label: 'About', icon: User },
    { href: '/showcase', label: 'Showcase', icon: Briefcase },
    { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
    { href: '/resume', label: 'Resume', icon: FileText },
  ]

  const isActive = (href: string) => {
    return pathname === href
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">
              <span className="bg-sunny-gradient bg-clip-text text-transparent">
                Sunny Stack
              </span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                      isActive(item.href)
                        ? 'bg-sunny-red text-white'
                        : 'text-sunny-brown hover:bg-sunny-gold/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Contact Button */}
            <div className="pl-3 border-l border-sunny-brown/20">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-medium py-2 px-4 rounded-full transition-all transform hover:scale-105"
              >
                <Mail className="w-4 h-4" />
                Contact
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-sunny-gold/20 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-sunny-brown" />
            ) : (
              <Menu className="w-6 h-6 text-sunny-brown" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-sunny-brown/10">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(item.href)
                        ? 'bg-sunny-red text-white'
                        : 'text-sunny-brown hover:bg-sunny-gold/20'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
              
              {/* Mobile Contact Button */}
              <div className="pt-3 mt-3 border-t border-sunny-brown/10">
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 bg-sunny-red hover:bg-sunny-darkRed text-white font-medium py-2 px-4 rounded-full transition-all"
                >
                  <Mail className="w-5 h-5" />
                  Contact
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}