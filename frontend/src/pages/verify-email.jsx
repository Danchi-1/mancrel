import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Mail } from 'lucide-react'

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-bg py-12 px-4">
      <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-md text-center">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6 text-accent">
          <Mail className="w-8 h-8" />
        </div>
        
        <h1 className="text-2xl font-display font-bold mb-4 text-neutral-900">Check your inbox</h1>
        <p className="text-sm text-neutral-600 mb-8">
          We've sent an email with a verification link. Please click the link to verify your account and complete the signup process.
        </p>
        
        <div className="pt-6 border-t border-gray-100 flex flex-col gap-4">
          <Link href="/signin" className="btn-primary w-full inline-block text-center">
            Return to Sign In
          </Link>
          <p className="text-xs text-neutral-500">
            Didn't receive the email? Check your spam folder or try signing in to resend.
          </p>
        </div>
      </div>
    </div>
  )
}
