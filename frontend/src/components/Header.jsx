"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Logo } from './Logo'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check for token on mount and on storage changes
    const check = () => setIsLoggedIn(!!localStorage.getItem('token'))
    check()
    window.addEventListener('storage', check)
    return () => window.removeEventListener('storage', check)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-neutral-700 hover:text-accent transition-colors duration-200 font-medium">
              Features
            </a>
            <a href="#catalog" className="text-neutral-700 hover:text-accent transition-colors duration-200 font-medium">
              Catalog
            </a>
            <a href="#deals" className="text-neutral-700 hover:text-accent transition-colors duration-200 font-medium">
              Deals
            </a>
            <a href="#ai" className="text-neutral-700 hover:text-accent transition-colors duration-200 font-medium">
              AI Inbox
            </a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <Link href="/dashboard" className="btn-primary flex items-center gap-2">
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ) : (
              <>
                <Link href="/signin" className="btn-secondary">Sign In</Link>
                <Link href="/signup" className="btn-primary">Start Free Trial</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors duration-200"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-100 animate-fade-in">
            <div className="flex flex-col space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2 text-neutral-700 hover:text-accent font-medium transition-colors">Features</a>
              <a href="#catalog" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2 text-neutral-700 hover:text-accent font-medium transition-colors">Catalog</a>
              <a href="#deals" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2 text-neutral-700 hover:text-accent font-medium transition-colors">Deals</a>
              <a href="#ai" onClick={() => setMobileMenuOpen(false)} className="px-2 py-2 text-neutral-700 hover:text-accent font-medium transition-colors">AI Inbox</a>
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                {isLoggedIn ? (
                  <Link href="/dashboard" className="btn-primary w-full block text-center">
                    Go to Dashboard →
                  </Link>
                ) : (
                  <>
                    <Link href="/signin" className="btn-secondary w-full block text-center">Sign In</Link>
                    <Link href="/signup" className="btn-primary w-full block text-center">Start Free Trial</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}