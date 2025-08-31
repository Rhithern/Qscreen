'use client'

import { signIn } from '@/lib/auth/actions'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { useAsyncAction } from '@/lib/hooks/use-async-action'
import Link from 'next/link'
import { AuthRedirect } from '@/components/layout/AuthRedirect'

export default function LoginPage() {
  const { toast } = useToast()

  const { run: handleSubmit, loading } = useAsyncAction(async (formData: FormData) => {
    try {
      await signIn(formData)
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Login failed",
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
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Access your interview platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="your@email.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/auth/reset"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>

            <AnimatedButton 
              type="submit" 
              className="w-full" 
              loading={loading}
              loadingText="Signing in..."
            >
              Sign In
            </AnimatedButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-4">
              Don't have an account?
            </p>
            <Link
              href="/auth/register/employer"
              className="w-full text-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 block"
            >
              Join as Employer/HR
            </Link>
            <p className="text-xs text-gray-500 mt-2">
              Candidates: Use your invite link to access the platform
            </p>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  )
}
