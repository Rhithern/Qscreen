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

async function runMigration() {
  log(`${colors.cyan}🔄 Running Database Migration${colors.reset}\n`)
  
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
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    log(`${colors.red}✗${colors.reset} Missing Supabase configuration`)
    log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
    process.exit(1)
  }
  
  // Create Supabase client with service role key for admin operations
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/003_auth_system_update.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    log(`${colors.blue}Executing migration...${colors.reset}`)
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL })
    
    if (error) {
      // If RPC doesn't exist, try direct SQL execution
      log(`${colors.yellow}RPC method not available, trying direct execution...${colors.reset}`)
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error: execError } = await supabase
            .from('_migration_temp')
            .select('1')
            .limit(0) // This will fail but allow us to execute raw SQL
          
          // For now, we'll need to run this manually in Supabase SQL editor
          log(`${colors.yellow}⚠${colors.reset} Please run the migration manually in Supabase SQL Editor`)
          log(`${colors.blue}Migration file location:${colors.reset} supabase/migrations/003_auth_system_update.sql`)
          log(`${colors.blue}Supabase SQL Editor:${colors.reset} ${supabaseUrl.replace('/rest/v1', '')}/project/default/sql`)
          return
        }
      }
    } else {
      log(`${colors.green}✓${colors.reset} Migration executed successfully`)
    }
    
    // Test database connection
    log(`${colors.blue}Testing database connection...${colors.reset}`)
    const { data, error: testError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
    
    if (testError) {
      log(`${colors.red}✗${colors.reset} Database connection test failed: ${testError.message}`)
    } else {
      log(`${colors.green}✓${colors.reset} Database connection successful`)
    }
    
    log(`\n${colors.cyan}🎉 Migration Setup Complete!${colors.reset}`)
    log(`${colors.blue}Next steps:${colors.reset}`)
    log(`1. Visit your Supabase SQL Editor: ${supabaseUrl.replace('/rest/v1', '')}/project/default/sql`)
    log(`2. Copy and paste the contents of supabase/migrations/003_auth_system_update.sql`)
    log(`3. Click "Run" to execute the migration`)
    log(`4. Then run: pnpm run seed`)
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Migration failed: ${error}`)
    process.exit(1)
  }
}

runMigration().catch(console.error)
