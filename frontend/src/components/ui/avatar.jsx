export function Avatar({ children, className = "" }) {
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${className}`}>
      {children}
    </div>
  )
}

export function AvatarImage({ src, alt = "" }) {
  return <img src={src} alt={alt} className="w-full h-full object-cover" />
}

export function AvatarFallback({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-center w-full h-full ${className}`}>
      {children}
    </div>
  )
}
