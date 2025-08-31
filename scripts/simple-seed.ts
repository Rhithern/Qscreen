#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`)
}

async function main() {
  log(`${colors.cyan}🌱 Seeding Demo Data${colors.reset}\n`)
  
  // Load environment variables from .env.local
  const envPath = join(process.cwd(), 'apps/web/.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  
  // Parse environment variables
  const env: Record<string, string> = {}
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=')
      }
    }
  })
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    log(`${colors.red}✗${colors.reset} Missing Supabase configuration`)
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    // 1. Create demo tenant using existing schema
    log(`${colors.blue}Creating Demo Company tenant...${colors.reset}`)
    
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('name', 'Demo Company')
      .single()
    
    let tenantId: string
    
    if (existingTenant) {
      tenantId = existingTenant.id
      log(`${colors.yellow}⚠${colors.reset} Using existing tenant: ${existingTenant.name}`)
    } else {
      const { data: newTenant, error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: 'Demo Company',
          subdomain: 'demo'
        })
        .select()
        .single()
      
      if (tenantError) {
        log(`${colors.red}✗${colors.reset} Failed to create tenant: ${tenantError.message}`)
        process.exit(1)
      }
      
      tenantId = newTenant.id
      log(`${colors.green}✓${colors.reset} Created tenant: Demo Company`)
    }
    
    // 2. Create demo employer user
    log(`${colors.blue}Creating demo employer...${colors.reset}`)
    
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'employer@demo.com',
      password: 'demo123456',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo Employer'
      }
    })
    
    if (authError && !authError.message.includes('already registered')) {
      log(`${colors.red}✗${colors.reset} Failed to create auth user: ${authError.message}`)
    } else {
      log(`${colors.green}✓${colors.reset} Created demo employer user`)
      
      // Update profile
      if (authUser.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            email: 'employer@demo.com',
            full_name: 'Demo Employer',
            role: 'owner'
          })
        
        // Add to tenant
        await supabase
          .from('tenant_members')
          .upsert({
            tenant_id: tenantId,
            user_id: authUser.user.id,
            role: 'owner'
          })
      }
    }
    
    // 3. Create demo job
    log(`${colors.blue}Creating demo job...${colors.reset}`)
    
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .upsert({
        tenant_id: tenantId,
        title: 'Frontend Developer',
        location: 'Remote',
        jd: 'We are looking for a skilled Frontend Developer to join our team.',
        competencies: ['JavaScript', 'React', 'TypeScript'],
        status: 'live',
        created_by: authUser?.user?.id
      })
      .select()
      .single()
    
    if (jobError) {
      log(`${colors.yellow}⚠${colors.reset} Job creation failed: ${jobError.message}`)
    } else {
      log(`${colors.green}✓${colors.reset} Created demo job`)
      
      // 4. Create demo questions
      const questions = [
        'Tell me about your experience with React',
        'How do you handle state management?',
        'Describe a challenging project you worked on'
      ]
      
      for (let i = 0; i < questions.length; i++) {
        await supabase
          .from('job_questions')
          .upsert({
            job_id: job.id,
            text: questions[i],
            position: i + 1,
            time_limit_sec: 120
          })
      }
      
      log(`${colors.green}✓${colors.reset} Created demo questions`)
      
      // 5. Create demo invite
      const inviteToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      
      await supabase
        .from('invites')
        .upsert({
          job_id: job.id,
          email: 'candidate@demo.com',
          name: 'Demo Candidate',
          token: inviteToken,
          expires_at: expiresAt.toISOString()
        })
      
      log(`${colors.green}✓${colors.reset} Created demo invite`)
      log(`${colors.cyan}Invite URL: http://localhost:3000/invite/${inviteToken}${colors.reset}`)
    }
    
    log(`\n${colors.cyan}🎉 Demo Data Seeded Successfully!${colors.reset}`)
    log(`${colors.blue}Demo Credentials:${colors.reset}`)
    log(`  Employer: employer@demo.com / demo123456`)
    log(`  Login at: http://localhost:3000/auth/login`)
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Seeding failed: ${error}`)
    process.exit(1)
  }
}

main().catch(console.error)
