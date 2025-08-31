#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

async function main() {
  // Load environment variables
  const envPath = join(process.cwd(), 'apps/web/.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  
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
  
  const supabase = createClient(supabaseUrl, serviceRoleKey)
  
  // Check what tables exist
  const { data: tables, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
  
  console.log('Available tables:', tables?.map(t => t.table_name))
  
  // Check tenants table structure if it exists
  const { data: columns } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type')
    .eq('table_schema', 'public')
    .eq('table_name', 'tenants')
  
  console.log('Tenants table columns:', columns)
}

main().catch(console.error)
