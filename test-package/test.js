// Test importing the core package
import { createApp, configureOpenAPI } from '@g-1/core';
import { execSync } from 'child_process';

console.log('✅ Successfully imported createApp:', typeof createApp);
console.log('✅ Successfully imported configureOpenAPI:', typeof configureOpenAPI);

// Test the CLI tool
console.log('Testing CLI tool availability...');

try {
  const result = execSync('npx g1-create --help', { encoding: 'utf8' });
  console.log('✅ CLI tool is available');
  console.log('CLI help output:', result);
} catch (error) {
  console.log('❌ CLI tool test failed:', error.message);
}