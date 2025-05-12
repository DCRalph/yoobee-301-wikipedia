#!/usr/bin/env node

// This script allows testing the AI moderator functionality in a server environment
// It uses the Next.js environment to ensure all server-side variables are available

const { execSync } = require('child_process');
const path = require('path');

console.log('Preparing to test AI moderator...\n');

// Run the test using Next.js execution environment
try {
  // Using 'next exec' ensures the script has access to server-side environment variables
  execSync('npx next exec scripts/run-moderator-test.js', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..')
  });
} catch (error) {
  console.error('Failed to run test:', error.message);
  process.exit(1);
} 