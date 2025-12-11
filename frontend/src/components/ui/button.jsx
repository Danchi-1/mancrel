import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none";

  // Basic support for sizes used in your components
  let sizeClasses = "h-10 py-2 px-4"; // default
  if (size === "sm") sizeClasses = "h-9 px-3 rounded-md";
  if (size === "icon") sizeClasses = "h-9 w-9";

  // Basic support for variants used in your components
  let variantClasses = "bg-gray-900 text-white hover:bg-gray-800"; // default
  if (variant === "outline") variantClasses = "border border-gray-300 bg-transparent hover:bg-gray-100";
  if (variant === "destructive") variantClasses = "bg-red-600 text-white hover:bg-red-700";

  return (
    <button className={cn(baseClasses, sizeClasses, variantClasses, className)} ref={ref} {...props} />
  )
})
Button.displayName = "Button"

export { Button }