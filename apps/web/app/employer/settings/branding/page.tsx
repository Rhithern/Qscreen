'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'

export default function BrandingPage() {
  const [loading, setLoading] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#6b7280',
    accentColor: '#10b981',
    logoUrl: '',
  })

  useEffect(() => {
    loadTenantData()
  }, [])

  const loadTenantData = async () => {
    try {
      const supabase = await createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) return

      const { data: membership } = await supabase
        .from('tenant_members')
        .select('tenant_id, tenants(*)')
        .eq('user_id', session.user.id)
        .single()

      if (membership?.tenants) {
        setTenant(membership.tenants)
        setFormData({
          name: membership.tenants.name || '',
          primaryColor: membership.tenants.theme?.primaryColor || '#3b82f6',
          secondaryColor: membership.tenants.theme?.secondaryColor || '#6b7280',
          accentColor: membership.tenants.theme?.accentColor || '#10b981',
          logoUrl: membership.tenants.logo_url || '',
        })
      }
    } catch (error) {
      console.error('Error loading tenant data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = await createClient()
      
      const theme = {
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          theme,
          logo_url: formData.logoUrl || null,
        })
        .eq('id', tenant.id)

      if (error) throw error

      toast({
        title: "Branding updated",
        description: "Your brand settings have been saved successfully",
      })

      // Reload page to apply new theme
      window.location.reload()
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update branding settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const supabase = await createClient()
      
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${tenant.id}/logo.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from('tenant-assets')
        .upload(fileName, file, { upsert: true })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('tenant-assets')
        .getPublicUrl(fileName)

      setFormData(prev => ({ ...prev, logoUrl: urlData.publicUrl }))
      
      toast({
        title: "Logo uploaded",
        description: "Logo uploaded successfully. Don't forget to save your changes.",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload logo",
        variant: "destructive",
      })
    }
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Branding Settings</h1>
          <p className="mt-2 text-gray-600">
            Customize your company's brand appearance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Basic information about your company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="logo">Company Logo</Label>
                <div className="mt-2">
                  {formData.logoUrl && (
                    <div className="mb-4">
                      <img 
                        src={formData.logoUrl} 
                        alt="Company Logo" 
                        className="h-16 w-auto object-contain"
                      />
                    </div>
                  )}
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Upload a logo for your company (PNG, JPG, SVG)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Color Theme</CardTitle>
              <CardDescription>
                Customize the colors used throughout your interview platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.primaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Input
                      id="accentColor"
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="w-16 h-10"
                    />
                    <Input
                      value={formData.accentColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your branding will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4" style={{ 
                borderColor: formData.primaryColor,
                backgroundColor: `${formData.primaryColor}10`
              }}>
                <div className="flex items-center space-x-4">
                  {formData.logoUrl && (
                    <img 
                      src={formData.logoUrl} 
                      alt="Logo Preview" 
                      className="h-8 w-auto"
                    />
                  )}
                  <h3 className="text-lg font-semibold" style={{ color: formData.primaryColor }}>
                    {formData.name}
                  </h3>
                </div>
                <div className="mt-4 space-y-2">
                  <div 
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded text-white text-sm"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    Accent Button
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
