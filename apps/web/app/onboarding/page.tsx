'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCompanyAndTenant } from './actions'
import { AnimatedButton } from '@/components/ui/animated-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { useAsyncAction } from '@/lib/hooks/use-async-action'

export default function OnboardingPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const { run: handleSubmit, loading } = useAsyncAction(async (formData: FormData) => {
    setErrors({})
    
    try {
      await createCompanyAndTenant(formData)
      
      toast({
        title: "Company created successfully!",
        description: "Welcome to your new interview platform.",
        variant: "success",
      })
      
      // Server action will handle redirect
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong"
      
      // Handle specific validation errors
      if (errorMessage.includes('Company name')) {
        setErrors({ companyName: errorMessage })
      } else {
        toast({
          title: "Setup failed",
          description: errorMessage,
          variant: "destructive",
        })
      }
      
      throw error
    }
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Complete Your Setup</CardTitle>
          <CardDescription>
            Set up your company to start conducting interviews
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                type="text"
                required
                placeholder="Acme Corp"
                className={errors.companyName ? "border-red-500" : ""}
              />
              {errors.companyName && (
                <p className="text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>

            {/* Subdomain field temporarily hidden since column doesn't exist in current schema */}
            <input type="hidden" name="subdomain" value="temp" />

            <div className="space-y-2">
              <Label htmlFor="logoUrl">Company Logo URL (Optional)</Label>
              <Input
                id="logoUrl"
                name="logoUrl"
                type="url"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="space-y-2">
              <Label>Brand Colors (Optional)</Label>
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Label htmlFor="primaryColor" className="text-xs">Primary</Label>
                  <Input
                    id="primaryColor"
                    name="primaryColor"
                    type="color"
                    defaultValue="#3b82f6"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="secondaryColor" className="text-xs">Secondary</Label>
                  <Input
                    id="secondaryColor"
                    name="secondaryColor"
                    type="color"
                    defaultValue="#64748b"
                  />
                </div>
              </div>
            </div>

            <AnimatedButton 
              type="submit" 
              className="w-full" 
              loading={loading}
              loadingText="Creating company..."
            >
              Complete Setup
            </AnimatedButton>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
