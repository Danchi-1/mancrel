export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  )
}
