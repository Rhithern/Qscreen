'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTenant } from '@/lib/tenant-context'

export default function BrandingPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const tenant = useTenant()
  
  const [isLoading, setIsLoading] = useState(false)
  const [logo, setLogo] = useState<File | null>(null)
  const [theme, setTheme] = useState(tenant.theme)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLogo(e.target.files[0])
    }
  }

  const handleColorChange = (key: 'primary' | 'background' | 'text', value: string) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      let logoUrl = tenant.logoUrl

      // Upload new logo if provided
      if (logo) {
        const fileExt = logo.name.split('.').pop()
        const filePath = `${tenant.id}/logo.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('tenant-assets')
          .upload(filePath, logo, {
            upsert: true
          })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('tenant-assets')
          .getPublicUrl(filePath)

        logoUrl = publicUrl
      }

      // Update tenant settings
      const { error: updateError } = await supabase
        .from('tenants')
        .update({
          theme,
          logo_url: logoUrl
        })
        .eq('id', tenant.id)

      if (updateError) throw updateError

      // Refresh the page to update the context
      router.refresh()

    } catch (error) {
      console.error('Error updating branding:', error)
      // TODO: Show error toast
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Branding Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo</CardTitle>
              <CardDescription>
                Upload your organization's logo. Recommended size: 200x50px
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tenant.logoUrl && (
                <div className="mb-4">
                  <img 
                    src={tenant.logoUrl} 
                    alt="Current logo"
                    className="max-h-12 dark:bg-white/10 rounded p-2"
                  />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>
                Customize your organization's colors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primary">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary"
                    type="color"
                    value={theme.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={theme.colors.primary}
                    onChange={(e) => handleColorChange('primary', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="background"
                    type="color"
                    value={theme.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={theme.colors.background}
                    onChange={(e) => handleColorChange('background', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="text"
                    type="color"
                    value={theme.colors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="w-20"
                  />
                  <Input
                    type="text"
                    value={theme.colors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
