import Link from 'next/link'

export function Logo({ className = "", lightText = false }) {
  return (
    <Link href="/" className={`flex items-center space-x-2 group ${className}`}>
      <div className="w-8 h-8 bg-[#4F46E5] rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110 shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Left stem of m */}
          <line x1="4" y1="16" x2="4" y2="8" />
          {/* First arch of m */}
          <path d="M4 11a3 3 0 0 1 6 0v5" />
          {/* Second arch of m (and stem of r) */}
          <path d="M10 11a3 3 0 0 1 6 0v5" />
          {/* Arch of r extending from the shared stem */}
          <path d="M16 11a3 3 0 0 1 4 0" />
        </svg>
      </div>
      <span className={`text-xl font-display font-bold ${lightText ? 'text-white' : 'text-gray-900'}`}>Mancrel</span>
    </Link>
  )
}
