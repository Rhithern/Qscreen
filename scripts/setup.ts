#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

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

function ensureDirectoryExists(filePath: string) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function copyEnvFile(source: string, destination: string, description: string): boolean {
  try {
    if (existsSync(destination)) {
      log(`${colors.yellow}⚠${colors.reset} ${description} already exists: ${destination}`);
      return false;
    }

    if (!existsSync(source)) {
      log(`${colors.red}✗${colors.reset} ${description} template not found: ${source}`);
      return false;
    }

    ensureDirectoryExists(destination);
    const content = readFileSync(source, 'utf8');
    writeFileSync(destination, content);
    log(`${colors.green}✓${colors.reset} Created ${description}: ${destination}`);
    return true;
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Failed to create ${description}: ${error}`);
    return false;
  }
}

function createEnvWithDefaults(destination: string, defaults: Record<string, string>, description: string): boolean {
  try {
    if (existsSync(destination)) {
      log(`${colors.yellow}⚠${colors.reset} ${description} already exists: ${destination}`);
      return false;
    }

    ensureDirectoryExists(destination);
    
    const content = Object.entries(defaults)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n';
    
    writeFileSync(destination, content);
    log(`${colors.green}✓${colors.reset} Created ${description}: ${destination}`);
    return true;
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Failed to create ${description}: ${error}`);
    return false;
  }
}

function main() {
  log(`${colors.cyan}🔧 Interview Platform Setup${colors.reset}\n`);
  
  const rootDir = process.cwd();
  let filesCreated = 0;
  
  // Setup web app environment
  const webEnvSource = join(rootDir, 'apps/web/.env.local.example');
  const webEnvDest = join(rootDir, 'apps/web/.env.local');
  
  if (copyEnvFile(webEnvSource, webEnvDest, 'Web app environment')) {
    filesCreated++;
  }
  
  // Setup conductor environment
  const conductorEnvSource = join(rootDir, 'apps/conductor/.env.example');
  const conductorEnvDest = join(rootDir, 'apps/conductor/.env');
  
  if (copyEnvFile(conductorEnvSource, conductorEnvDest, 'Conductor environment')) {
    filesCreated++;
  }
  
  // Create conductor .env if example doesn't exist
  if (!existsSync(conductorEnvSource) && !existsSync(conductorEnvDest)) {
    const conductorDefaults = {
      'PORT': '8080',
      'NODE_ENV': 'development',
      'ALLOWED_ORIGINS': 'http://localhost:3000',
      'DEEPGRAM_API_KEY': 'your_deepgram_key',
      'ELEVENLABS_API_KEY': 'your_elevenlabs_key',
      'OPENAI_API_KEY': 'your_openai_key'
    };
    
    if (createEnvWithDefaults(conductorEnvDest, conductorDefaults, 'Conductor environment (defaults)')) {
      filesCreated++;
    }
  }
  
  // Create logs directory
  const logsDir = join(rootDir, 'logs');
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
    log(`${colors.green}✓${colors.reset} Created logs directory: ${logsDir}`);
    filesCreated++;
  }
  
  // Summary and instructions
  log(`\n${colors.cyan}Setup Summary:${colors.reset}`);
  if (filesCreated > 0) {
    log(`${colors.green}✓${colors.reset} Created ${filesCreated} file(s)`);
    
    log(`\n${colors.yellow}📝 Next Steps:${colors.reset}`);
    log(`\n1. ${colors.blue}Configure Supabase:${colors.reset}`);
    log(`   Edit: ${webEnvDest}`);
    log(`   Set: NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co`);
    log(`   Set: NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key`);
    log(`   Get keys from: https://supabase.com/dashboard/project/_/settings/api`);
    
    log(`\n2. ${colors.blue}Configure Email (Optional):${colors.reset}`);
    log(`   Edit: ${webEnvDest}`);
    log(`   Set: RESEND_API_KEY=your-resend-key (get from https://resend.com/api-keys)`);
    log(`   Set: FROM_EMAIL=noreply@yourdomain.com`);
    
    log(`\n3. ${colors.blue}Configure AI Services (Optional):${colors.reset}`);
    log(`   Edit: ${conductorEnvDest}`);
    log(`   Set: DEEPGRAM_API_KEY=your-deepgram-key`);
    log(`   Set: ELEVENLABS_API_KEY=your-elevenlabs-key`);
    log(`   Set: OPENAI_API_KEY=your-openai-key`);
    
    log(`\n4. ${colors.blue}Run the application:${colors.reset}`);
    log(`   ${colors.cyan}pnpm seed:dev${colors.reset}    # Create demo data`);
    log(`   ${colors.cyan}pnpm up${colors.reset}          # Start both services`);
    log(`   ${colors.cyan}pnpm doctor${colors.reset}      # Verify setup`);
    
  } else {
    log(`${colors.yellow}⚠${colors.reset} All environment files already exist`);
    log(`Run ${colors.cyan}pnpm doctor${colors.reset} to verify your configuration`);
  }
  
  log(`\n${colors.green}🚀 Setup complete!${colors.reset}`);
}

main();
