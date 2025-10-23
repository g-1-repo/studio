// Simple test to verify the package structure
import fs from 'fs';
import path from 'path';

console.log('Testing @g-1/core package structure...');

// Check if the package is installed
const packagePath = './node_modules/@g-1/core';
if (fs.existsSync(packagePath)) {
  console.log('✅ Package is installed');
  
  // Check package.json
  const pkgJson = JSON.parse(fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8'));
  console.log('✅ Package name:', pkgJson.name);
  console.log('✅ Package version:', pkgJson.version);
  
  // Check if dist folder exists
  const distPath = path.join(packagePath, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✅ Dist folder exists');
    
    // Check main entry point
    const mainFile = path.join(packagePath, pkgJson.main);
    if (fs.existsSync(mainFile)) {
      console.log('✅ Main entry point exists:', pkgJson.main);
    } else {
      console.log('❌ Main entry point missing:', pkgJson.main);
    }
    
    // Check CLI script
    if (pkgJson.bin && pkgJson.bin['g1-create']) {
      const cliFile = path.join(packagePath, pkgJson.bin['g1-create']);
      if (fs.existsSync(cliFile)) {
        console.log('✅ CLI script exists:', pkgJson.bin['g1-create']);
      } else {
        console.log('❌ CLI script missing:', pkgJson.bin['g1-create']);
      }
    }
  } else {
    console.log('❌ Dist folder missing');
  }
} else {
  console.log('❌ Package not installed');
}

console.log('\nPackage structure test completed.');