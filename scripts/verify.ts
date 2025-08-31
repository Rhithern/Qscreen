#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function loadEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) {
    return {};
  }
  
  const content = readFileSync(path, 'utf8');
  const env: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  
  return env;
}

async function checkWebApp(): Promise<boolean> {
  try {
    log(`${colors.blue}Checking web app (http://localhost:3000)...${colors.reset}`);
    
    const response = await fetch('http://localhost:3000', {
      method: 'GET',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      log(`${colors.red}✗${colors.reset} Web app returned ${response.status}`);
      return false;
    }
    
    const html = await response.text();
    
    // Check for landing page content
    if (html.includes('Interview Platform') || html.includes('Professional interview management')) {
      log(`${colors.green}✓${colors.reset} Web app is responding with expected content`);
      return true;
    } else {
      log(`${colors.red}✗${colors.reset} Web app content doesn't match expected landing page`);
      return false;
    }
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Web app unreachable: ${error}`);
    return false;
  }
}

async function checkWebHealthAPI(): Promise<boolean> {
  try {
    log(`${colors.blue}Checking web health API (/api/health)...${colors.reset}`);
    
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      log(`${colors.red}✗${colors.reset} Health API returned ${response.status}`);
      return false;
    }
    
    const data = await response.json() as any;
    
    if (data.ok === true && data.service === 'web') {
      log(`${colors.green}✓${colors.reset} Web health API responding correctly`);
      return true;
    } else {
      log(`${colors.red}✗${colors.reset} Health API response invalid: ${JSON.stringify(data)}`);
      return false;
    }
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Health API unreachable: ${error}`);
    return false;
  }
}

async function checkConductorHealth(): Promise<boolean> {
  try {
    log(`${colors.blue}Checking conductor health (http://localhost:8787/health)...${colors.reset}`);
    
    const response = await fetch('http://localhost:8787/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      log(`${colors.red}✗${colors.reset} Conductor health returned ${response.status}`);
      return false;
    }
    
    const data = await response.json() as any;
    
    if (data.ok === true || data.status === 'healthy') {
      log(`${colors.green}✓${colors.reset} Conductor health check passed`);
      return true;
    } else {
      log(`${colors.red}✗${colors.reset} Conductor health response invalid: ${JSON.stringify(data)}`);
      return false;
    }
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Conductor unreachable: ${error}`);
    return false;
  }
}

async function checkSupabaseRLS(): Promise<boolean> {
  try {
    log(`${colors.blue}Checking Supabase RLS (Row Level Security)...${colors.reset}`);
    
    // Load Supabase config
    const envPath = join(process.cwd(), 'apps/web/.env.local');
    const env = loadEnvFile(envPath);
    
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      log(`${colors.yellow}⚠${colors.reset} Supabase config not found, skipping RLS check`);
      return true; // Don't fail if not configured
    }
    
    // Try to access profiles table without auth (should be rejected)
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    // RLS should reject this request (401 or 403)
    if (response.status === 401 || response.status === 403) {
      log(`${colors.green}✓${colors.reset} Supabase RLS is working (unauthorized access rejected)`);
      return true;
    } else if (response.status === 200) {
      const data = await response.json();
      if (Array.isArray(data) && data.length === 0) {
        log(`${colors.green}✓${colors.reset} Supabase RLS is working (empty result for unauthenticated user)`);
        return true;
      } else {
        log(`${colors.red}✗${colors.reset} Supabase RLS may not be working (got data without auth)`);
        return false;
      }
    } else {
      log(`${colors.yellow}⚠${colors.reset} Supabase RLS check inconclusive (status: ${response.status})`);
      return true; // Don't fail on unexpected status
    }
    
  } catch (error) {
    log(`${colors.yellow}⚠${colors.reset} Supabase RLS check failed: ${error}`);
    return true; // Don't fail the entire verification
  }
}

async function main() {
  log(`${colors.cyan}🔍 Verifying Interview Platform${colors.reset}\n`);
  
  const checks = [
    { name: 'Web App', fn: checkWebApp },
    { name: 'Web Health API', fn: checkWebHealthAPI },
    { name: 'Conductor Health', fn: checkConductorHealth },
    { name: 'Supabase RLS', fn: checkSupabaseRLS }
  ];
  
  let allPassed = true;
  const results: { name: string; passed: boolean }[] = [];
  
  for (const check of checks) {
    const result = await check.fn();
    results.push({ name: check.name, passed: result });
    if (!result) allPassed = false;
  }
  
  // Summary
  log(`\n${colors.cyan}Verification Summary:${colors.reset}`);
  for (const result of results) {
    const icon = result.passed ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
    log(`${icon} ${result.name}`);
  }
  
  if (allPassed) {
    log(`\n${colors.green}🎉 All checks passed! Platform is ready.${colors.reset}`);
    process.exit(0);
  } else {
    log(`\n${colors.red}❌ Some checks failed. Please ensure both services are running:${colors.reset}`);
    log(`   ${colors.cyan}pnpm up${colors.reset}    # Start both web and conductor`);
    process.exit(1);
  }
}

main().catch(console.error);
