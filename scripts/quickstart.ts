#!/usr/bin/env tsx

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runCommand(command: string, args: string[], cwd?: string): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      cwd: cwd || process.cwd(),
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output + errorOutput
      });
    });
    
    child.on('error', (error) => {
      resolve({
        success: false,
        output: error.message
      });
    });
  });
}

function startDevServers(): Promise<void> {
  return new Promise((resolve) => {
    log(`${colors.blue}Starting development servers...${colors.reset}`);
    
    const child = spawn('npm', ['run', 'dev:all'], {
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit',
      detached: true
    });
    
    // Give servers time to start
    setTimeout(() => {
      log(`${colors.green}✓${colors.reset} Development servers started`);
      resolve();
    }, 5000);
  });
}

async function main() {
  log(`${colors.cyan}${colors.bold}🚀 Interview Platform Quickstart${colors.reset}\n`);
  
  try {
    // Step 1: Setup environment files
    log(`${colors.blue}1. Setting up environment files...${colors.reset}`);
    const setupResult = await runCommand('node', ['--import', 'tsx', 'scripts/setup.ts']);
    if (!setupResult.success) {
      log(`${colors.red}✗${colors.reset} Setup failed: ${setupResult.output}`);
      log(`${colors.yellow}Hint: Make sure you have Node.js installed and try running 'npm install' first${colors.reset}`);
      process.exit(1);
    }
    log(`${colors.green}✓${colors.reset} Environment files ready`);
    
    // Step 2: Install dependencies
    log(`\n${colors.blue}2. Installing dependencies...${colors.reset}`);
    const installResult = await runCommand('npm', ['install']);
    if (!installResult.success) {
      log(`${colors.red}✗${colors.reset} Install failed: ${installResult.output}`);
      log(`${colors.yellow}Hint: Check your internet connection and try 'npm cache clean --force'${colors.reset}`);
      process.exit(1);
    }
    log(`${colors.green}✓${colors.reset} Dependencies installed`);
    
    // Step 3: Start development servers
    log(`\n${colors.blue}3. Starting development servers...${colors.reset}`);
    await startDevServers();
    
    // Step 4: Wait for servers to be ready
    log(`\n${colors.blue}4. Waiting for servers to be ready...${colors.reset}`);
    await sleep(3000);
    
    // Step 5: Seed demo data
    log(`\n${colors.blue}5. Seeding demo data...${colors.reset}`);
    const seedResult = await runCommand('node', ['--import', 'tsx', 'scripts/seed.ts']);
    if (!seedResult.success) {
      log(`${colors.red}✗${colors.reset} Seeding failed: ${seedResult.output}`);
      log(`${colors.yellow}Hint: Make sure Supabase credentials are configured in apps/web/.env.local${colors.reset}`);
      process.exit(1);
    }
    
    // Extract candidate invite URL from seed output
    const candidateUrlMatch = seedResult.output.match(/http:\/\/localhost:3000\/candidate\?token=([a-f0-9-]+)/);
    const candidateUrl = candidateUrlMatch ? candidateUrlMatch[0] : 'http://localhost:3000/candidate?token=<check-seed-output>';
    
    // Step 6: Print success message and next steps
    log(`\n${colors.green}${colors.bold}🎉 Quickstart Complete!${colors.reset}\n`);
    
    log(`${colors.cyan}${colors.bold}WHAT TO DO NEXT:${colors.reset}\n`);
    
    log(`${colors.bold}Demo Accounts:${colors.reset}`);
    log(`  Employer: ${colors.green}employer@demo.com${colors.reset} / ${colors.green}demo123456${colors.reset}`);
    log(`  HR Manager: ${colors.green}hr@demo.com${colors.reset} / ${colors.green}demo123456${colors.reset}`);
    log(`  Candidate: ${colors.green}candidate@demo.com${colors.reset} / ${colors.green}demo123456${colors.reset}`);
    
    log(`\n${colors.bold}Open these URLs:${colors.reset}`);
    log(`  ${colors.blue}Employer login:${colors.reset} http://localhost:3000/auth/login`);
    log(`  ${colors.blue}Employer dashboard:${colors.reset} http://localhost:3000/employer`);
    log(`  ${colors.blue}HR dashboard:${colors.reset} http://localhost:3000/hr`);
    log(`  ${colors.blue}Candidate invite:${colors.reset} ${candidateUrl}`);
    log(`    ${colors.yellow}(open in Incognito/private window)${colors.reset}`);
    
    log(`\n${colors.bold}Health checks:${colors.reset}`);
    log(`  ${colors.blue}Web debug env:${colors.reset} http://localhost:3000/debug/env`);
    log(`  ${colors.blue}Conductor health:${colors.reset} http://localhost:8787/health`);
    
    log(`\n${colors.yellow}Press Ctrl+C to stop the servers when done testing.${colors.reset}`);
    
  } catch (error) {
    log(`${colors.red}✗${colors.reset} Quickstart failed: ${error}`);
    log(`${colors.yellow}Hint: Try running individual commands manually: setup → install → dev:all → seed${colors.reset}`);
    process.exit(1);
  }
}

main().catch(console.error);
