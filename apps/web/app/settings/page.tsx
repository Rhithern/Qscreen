import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Settings, Users, Building2, Bell, Shield } from 'lucide-react'

async function getSettingsData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get user's tenant and role
  const { data: tenantMember } = await supabase
    .from('tenant_members')
    .select(`
      role,
      tenants(
        id,
        name,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!tenantMember) {
    redirect('/onboarding')
  }

  // Get team members if user is admin/owner
  let teamMembers = []
  if (tenantMember.role === 'admin' || tenantMember.role === 'owner') {
    const { data: members } = await supabase
      .from('tenant_members')
      .select(`
        id,
        role,
        created_at,
        profiles(
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('tenant_id', tenantMember.tenants.id)
      .order('created_at', { ascending: false })

    teamMembers = members || []
  }

  return {
    user,
    profile,
    tenant: tenantMember.tenants,
    userRole: tenantMember.role,
    teamMembers
  }
}

export default async function SettingsPage() {
  const { user, profile, tenant, userRole, teamMembers } = await getSettingsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and organization settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback>
                  {profile?.full_name?.split(' ').map(n => n[0]).join('') || user.email?.[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" size="sm">Change Photo</Button>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, GIF or PNG. 1MB max.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  defaultValue={profile?.full_name || ''}
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user.email || ''}
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization
            </CardTitle>
            <CardDescription>
              Manage your organization details and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  defaultValue={tenant?.name || ''}
                  placeholder="Enter organization name"
                  disabled={userRole !== 'admin' && userRole !== 'owner'}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Role</Label>
                <div>
                  <Badge variant="outline" className="capitalize">
                    {userRole}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Organization ID</Label>
              <Input
                value={tenant?.id || ''}
                disabled
                className="font-mono text-sm"
              />
              <p className="text-sm text-muted-foreground">
                Use this ID for API integrations and support requests
              </p>
            </div>

            {(userRole === 'admin' || userRole === 'owner') && (
              <div className="flex justify-end">
                <Button>Update Organization</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Management */}
        {(userRole === 'admin' || userRole === 'owner') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage team members and their access levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {teamMembers.length} team member{teamMembers.length !== 1 ? 's' : ''}
                  </p>
                  <Button size="sm">Invite Member</Button>
                </div>

                <div className="space-y-3">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.profiles?.avatar_url} />
                          <AvatarFallback>
                            {member.profiles?.full_name?.split(' ').map(n => n[0]).join('') || 
                             member.profiles?.email?.[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profiles?.full_name || member.profiles?.email}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.profiles?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {member.role}
                        </Badge>
                        {member.profiles?.id !== user.id && (
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about interviews and responses
                  </p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Browser Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified in your browser for real-time updates
                  </p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: Never
                  </p>
                </div>
                <Button variant="outline" size="sm">Change Password</Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Button variant="outline" size="sm">Setup 2FA</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
