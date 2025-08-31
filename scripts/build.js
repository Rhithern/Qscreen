#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}]${colors.reset} ${message}`);
}

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command} ${args.join(' ')}`, colors.blue);
    
    const child = spawn(command, args, {
      cwd: path.resolve(cwd),
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function buildProject() {
  try {
    console.log(colors.green + '🏗️  Building Interview Platform' + colors.reset);
    
    // Create logs directory if it doesn't exist
    const logsDir = path.resolve('./logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      log('Created logs directory', colors.yellow);
    }

    // Install dependencies
    log('Installing dependencies...', colors.yellow);
    await runCommand('pnpm', ['install'], '.');

    // Build packages in order
    log('Building shared packages...', colors.yellow);
    await runCommand('pnpm', ['build'], './packages/shared');

    log('Building web application...', colors.yellow);
    await runCommand('pnpm', ['build'], './apps/web');

    log('Building conductor service...', colors.yellow);
    await runCommand('pnpm', ['build'], './apps/conductor');

    log('✅ Build completed successfully!', colors.green);
    
  } catch (error) {
    log(`❌ Build failed: ${error.message}`, colors.red);
    process.exit(1);
  }
}

buildProject();
