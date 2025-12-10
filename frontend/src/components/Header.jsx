"use client"

import { useState } from 'react'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-neutral-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                <span className="text-white font-display font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-display font-bold text-primary">Mancrel</span>
            </a>
          </div>

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

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="btn-secondary">
              Sign In
            </button>
            <button className="btn-primary">
              Start Free Trial
            </button>
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
          <div className="md:hidden py-4 border-t border-neutral-100">
            <div className="flex flex-col space-y-4">
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
              <div className="pt-4 space-y-2">
                <button className="btn-secondary w-full">Sign In</button>
                <button className="btn-primary w-full">Start Free Trial</button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}