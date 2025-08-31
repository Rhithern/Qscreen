#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

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

function copyEnvFile(source, destination) {
  try {
    if (fs.existsSync(destination)) {
      log(`${destination} already exists, skipping...`, colors.yellow);
      return false;
    }

    if (!fs.existsSync(source)) {
      log(`${source} not found, skipping...`, colors.red);
      return false;
    }

    fs.copyFileSync(source, destination);
    log(`Created ${destination}`, colors.green);
    return true;
  } catch (error) {
    log(`Failed to copy ${source}: ${error.message}`, colors.red);
    return false;
  }
}

function setupEnvironment() {
  console.log(colors.blue + '🔧 Setting up environment files' + colors.reset);
  
  const envFiles = [
    {
      source: './apps/web/.env.local.example',
      destination: './apps/web/.env.local'
    },
    {
      source: './apps/conductor/.env.example',
      destination: './apps/conductor/.env'
    }
  ];

  let created = 0;
  envFiles.forEach(({ source, destination }) => {
    if (copyEnvFile(source, destination)) {
      created++;
    }
  });

  if (created > 0) {
    console.log('\n' + colors.yellow + '⚠️  Important: Please update the environment files with your actual values:' + colors.reset);
    envFiles.forEach(({ destination }) => {
      if (fs.existsSync(destination)) {
        console.log(`   - ${destination}`);
      }
    });
    console.log('\nRefer to the README.md for detailed setup instructions.');
  } else {
    log('All environment files already exist', colors.green);
  }
}

setupEnvironment();
