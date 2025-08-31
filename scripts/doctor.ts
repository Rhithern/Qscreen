#!/usr/bin/env tsx

import { execSync } from 'child_process';
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

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

async function checkNodeVersion(): Promise<boolean> {
  try {
    const version = execSync('node --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    
    if (majorVersion >= 20) {
      log(`${checkmark()} Node.js ${version} (>= 20.0.0 required)`);
      return true;
    } else {
      log(`${crossmark()} Node.js ${version} - requires >= 20.0.0`);
      return false;
    }
  } catch (error) {
    log(`${crossmark()} Node.js not found`);
    return false;
  }
}

async function checkPnpmVersion(): Promise<boolean> {
  try {
    const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
    const majorVersion = parseInt(version.split('.')[0]);
    
    if (majorVersion >= 8) {
      log(`${checkmark()} pnpm ${version} (>= 8.0.0 required)`);
      return true;
    } else {
      log(`${crossmark()} pnpm ${version} - requires >= 8.0.0`);
      return false;
    }
  } catch (error) {
    log(`${crossmark()} pnpm not found - install with: npm install -g pnpm`);
    return false;
  }
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

function checkWebEnvs(): boolean {
  const envPath = join(process.cwd(), 'apps/web/.env.local');
  const env = loadEnvFile(envPath);
  
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_CONDUCTOR_URL'
  ];
  
  let allPresent = true;
  
  log(`\n${colors.blue}Web App Environment (.env.local):${colors.reset}`);
  
  for (const envVar of requiredEnvs) {
    if (env[envVar] && env[envVar] !== 'your_supabase_project_url' && env[envVar] !== 'your_supabase_anon_key') {
      log(`${checkmark()} ${envVar}`);
    } else {
      log(`${crossmark()} ${envVar} - missing or placeholder`);
      allPresent = false;
    }
  }
  
  // Check Supabase URL format
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
    log(`${checkmark()} Supabase URL format looks valid`);
  } else if (env.NEXT_PUBLIC_SUPABASE_URL) {
    log(`${warning()} Supabase URL format may be invalid`);
  }
  
  return allPresent;
}

function checkConductorEnvs(): boolean {
  const envPath = join(process.cwd(), 'apps/conductor/.env');
  const env = loadEnvFile(envPath);
  
  const requiredEnvs = ['PORT', 'ALLOWED_ORIGINS'];
  const optionalEnvs = ['DEEPGRAM_API_KEY', 'ELEVENLABS_API_KEY', 'OPENAI_API_KEY'];
  
  let allPresent = true;
  
  log(`\n${colors.blue}Conductor Environment (.env):${colors.reset}`);
  
  for (const envVar of requiredEnvs) {
    if (env[envVar]) {
      log(`${checkmark()} ${envVar}`);
    } else {
      log(`${crossmark()} ${envVar} - missing`);
      allPresent = false;
    }
  }
  
  log(`\n${colors.cyan}Optional API Keys:${colors.reset}`);
  for (const envVar of optionalEnvs) {
    if (env[envVar] && env[envVar] !== 'your_deepgram_key' && env[envVar] !== 'your_elevenlabs_key' && env[envVar] !== 'your_openai_key') {
      log(`${checkmark()} ${envVar}`);
    } else {
      log(`${warning()} ${envVar} - not configured (optional)`);
    }
  }
  
  return allPresent;
}

async function checkConductorHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:8080/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      log(`${checkmark()} Conductor health check: ${JSON.stringify(data)}`);
      return true;
    } else {
      log(`${crossmark()} Conductor health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(`${warning()} Conductor not running or unreachable (http://localhost:8080/health)`);
    return false;
  }
}

async function checkDatabaseSchema(): Promise<boolean> {
  try {
    const envPath = join(process.cwd(), 'apps/web/.env.local');
    const env = loadEnvFile(envPath);
    
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
      log(`${warning()} Supabase not configured - skipping database checks`);
      return true; // Don't fail if not configured
    }
    
    // Dynamic import to avoid issues if @supabase/supabase-js isn't available
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if onboarding_completed column exists
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles')
      .eq('column_name', 'onboarding_completed')
      .single();
    
    if (error || !data) {
      log(`${crossmark()} onboarding_completed column missing from profiles table`);
      log(`${colors.red}  Fix: Run the migration in Supabase SQL (see scripts/schema.sql)${colors.reset}`);
      return false;
    } else {
      log(`${checkmark()} onboarding_completed column exists in profiles table`);
      return true;
    }
  } catch (error) {
    log(`${warning()} Database schema check failed: ${error}`);
    return true; // Don't fail the overall check for connection issues
  }
}

async function main() {
  log(`${colors.cyan}🏥 Interview Platform Doctor${colors.reset}\n`);
  
  const checks = [
    { name: 'Node.js version', fn: checkNodeVersion },
    { name: 'pnpm version', fn: checkPnpmVersion }
  ];
  
  let allPassed = true;
  
  // System checks
  for (const check of checks) {
    const result = await check.fn();
    if (!result) allPassed = false;
  }
  
  // Environment checks
  const webEnvsOk = checkWebEnvs();
  const conductorEnvsOk = checkConductorEnvs();
  
  if (!webEnvsOk || !conductorEnvsOk) {
    allPassed = false;
  }
  
  // Database schema check
  log(`\n${colors.blue}Database Schema:${colors.reset}`);
  const schemaOk = await checkDatabaseSchema();
  if (!schemaOk) {
    allPassed = false;
  }
  
  // Service health check
  log(`\n${colors.blue}Service Health:${colors.reset}`);
  await checkConductorHealth();
  
  // Summary
  log(`\n${colors.cyan}Summary:${colors.reset}`);
  if (allPassed) {
    log(`${checkmark()} All critical checks passed! Ready for development.`);
    process.exit(0);
  } else {
    log(`${crossmark()} Some checks failed. Run 'pnpm setup' to fix environment issues.`);
    process.exit(1);
  }
}

main().catch(console.error);
