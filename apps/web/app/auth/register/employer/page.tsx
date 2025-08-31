'use client'

import { useState } from 'react'
import { signUpEmployer } from '@/lib/auth/actions'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { useAsyncAction } from '@/lib/hooks/use-async-action'
import Link from 'next/link'
import { AuthRedirect } from '@/components/layout/AuthRedirect'

export default function EmployerRegisterPage() {
  const { toast } = useToast()
  const [enable2FA, setEnable2FA] = useState(false)

  const { run: handleSubmit, loading } = useAsyncAction(async (formData: FormData) => {
    try {
      await signUpEmployer(formData)
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
      throw error
    }
  })

  return (
    <>
      <AuthRedirect />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Employer Account</CardTitle>
          <CardDescription>
            Start conducting interviews with your team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4" autoComplete="off">
            <input type="hidden" name="role" value="employer" />
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                required
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="john@company.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                placeholder="Acme Corp"
                autoComplete="organization"
              />
              <p className="text-xs text-gray-500">
                You can set this up later during onboarding
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enable2FA"
                  checked={enable2FA}
                  onChange={(e) => setEnable2FA(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="enable2FA" className="text-sm">
                  Enable 2FA (recommended)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="terms"
                  type="checkbox"
                  required
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-500">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
            </div>

            <AnimatedButton 
              type="submit" 
              className="w-full" 
              loading={loading}
              loadingText="Creating account..."
            >
              Create Account
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
