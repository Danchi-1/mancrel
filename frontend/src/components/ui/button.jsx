export function Button({ children, className = "", size = "md", ...props }) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-200 ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
