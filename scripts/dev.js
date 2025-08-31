#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

function log(service, message, color = colors.reset) {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
}

function startService(name, command, args, cwd, color) {
  log(name, `Starting ${name}...`, color);
  
  const child = spawn(command, args, {
    cwd: path.resolve(cwd),
    stdio: 'pipe',
    shell: true
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => log(name, line, color));
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => log(name, line, colors.red));
  });

  child.on('close', (code) => {
    if (code !== 0) {
      log(name, `Process exited with code ${code}`, colors.red);
    } else {
      log(name, 'Process exited successfully', color);
    }
  });

  child.on('error', (error) => {
    log(name, `Error: ${error.message}`, colors.red);
  });

  return child;
}

// Handle graceful shutdown
function setupGracefulShutdown(processes) {
  process.on('SIGINT', () => {
    console.log('\n' + colors.yellow + 'Shutting down services...' + colors.reset);
    processes.forEach(child => {
      if (child && !child.killed) {
        child.kill('SIGTERM');
      }
    });
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });
}

// Start services
console.log(colors.green + '🚀 Starting Interview Platform Development Environment' + colors.reset);
console.log('Press Ctrl+C to stop all services\n');

const processes = [
  startService('WEB', 'pnpm', ['dev'], './apps/web', colors.green),
  startService('CONDUCTOR', 'pnpm', ['dev'], './apps/conductor', colors.blue)
];

setupGracefulShutdown(processes);
