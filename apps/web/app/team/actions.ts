'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const fullName = formData.get('fullName') as string

  if (!email || !role || !fullName) {
    throw new Error('Missing required fields')
  }

  if (!['admin', 'recruiter', 'reviewer'].includes(role)) {
    throw new Error('Invalid role')
  }

  // Verify user has permission to invite (owner/admin only)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['owner', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  if (!profile.tenant_id) {
    throw new Error('No tenant associated with user')
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single()

  if (existingUser) {
    // Check if already a team member
    const { data: existingMember } = await supabase
      .from('tenant_members')
      .select('id')
      .eq('tenant_id', profile.tenant_id)
      .eq('user_id', existingUser.id)
      .single()

    if (existingMember) {
      throw new Error('User is already a team member')
    }

    // Add existing user to tenant
    const { error } = await supabase
      .from('tenant_members')
      .insert({
        tenant_id: profile.tenant_id,
        user_id: existingUser.id,
        role,
        invited_by: user.id,
        joined_at: new Date().toISOString()
      })

    if (error) {
      throw new Error(`Failed to add team member: ${error.message}`)
    }
  } else {
    // Create invitation for new user
    const inviteToken = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const { error } = await supabase
      .from('team_invites')
      .insert({
        tenant_id: profile.tenant_id,
        email,
        full_name: fullName,
        role,
        token: inviteToken,
        expires_at: expiresAt.toISOString(),
        invited_by: user.id
      })

    if (error) {
      throw new Error(`Failed to create invitation: ${error.message}`)
    }

    // TODO: Send invitation email
  }

  revalidatePath('/team')
  return { success: true }
}

export async function updateTeamMemberRole(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const memberId = formData.get('memberId') as string
  const newRole = formData.get('role') as string

  if (!memberId || !newRole) {
    throw new Error('Missing required fields')
  }

  if (!['admin', 'recruiter', 'reviewer'].includes(newRole)) {
    throw new Error('Invalid role')
  }

  // Verify user has permission (owner/admin only)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['owner', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  // Update member role
  const { error } = await supabase
    .from('tenant_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)

  if (error) {
    throw new Error(`Failed to update role: ${error.message}`)
  }

  revalidatePath('/team')
  return { success: true }
}

export async function removeTeamMember(memberId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Verify user has permission (owner/admin only)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['owner', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  // Cannot remove self
  const { data: member } = await supabase
    .from('tenant_members')
    .select('user_id')
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (member?.user_id === user.id) {
    throw new Error('Cannot remove yourself from the team')
  }

  // Remove member
  const { error } = await supabase
    .from('tenant_members')
    .delete()
    .eq('id', memberId)
    .eq('tenant_id', profile.tenant_id)

  if (error) {
    throw new Error(`Failed to remove team member: ${error.message}`)
  }

  revalidatePath('/team')
  return { success: true }
}

export async function updateTenantSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const companyName = formData.get('companyName') as string
  const logoUrl = formData.get('logoUrl') as string
  const primaryColor = formData.get('primaryColor') as string
  const subdomain = formData.get('subdomain') as string

  // Verify user has permission (owner/admin only)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.role || !['owner', 'admin'].includes(profile.role)) {
    throw new Error('Insufficient permissions')
  }

  if (!profile.tenant_id) {
    throw new Error('No tenant associated with user')
  }

  // Update tenant settings
  const settings = {
    branding: {
      logo_url: logoUrl || null,
      primary_color: primaryColor || '#3b82f6'
    }
  }

  const updateData: any = { settings }
  if (companyName) updateData.name = companyName
  if (subdomain) updateData.subdomain = subdomain

  const { error } = await supabase
    .from('tenants')
    .update(updateData)
    .eq('id', profile.tenant_id)

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`)
  }

  revalidatePath('/settings')
  return { success: true }
}
