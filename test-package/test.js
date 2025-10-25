// Test importing the core package
import { createRouter } from '@g-1/core';
import { execSync } from 'child_process';

console.log('✅ Successfully imported createRouter:', typeof createRouter);

// Test the CLI tool
console.log('Testing CLI tool availability...');

try {
  const result = execSync('npx g1-create --help', { encoding: 'utf8' });
  console.log('✅ CLI tool is available');
  console.log('CLI help output:', result);
} catch (error) {
  console.log('❌ CLI tool test failed:', error.message);
}