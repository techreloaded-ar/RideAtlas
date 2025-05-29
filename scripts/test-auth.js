#!/usr/bin/env node

// Test script to verify authentication setup
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 RideAtlas Authentication Test Suite\n');

// Test 1: Check if environment files exist
console.log('1. Environment Configuration:');
const envFiles = ['.env.local', '.env'];
let envExists = false;
for (const file of envFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file} exists`);
    envExists = true;
  } else {
    console.log(`   ✗ ${file} missing`);
  }
}

// Test 2: Check if required dependencies are installed
console.log('\n2. Dependencies:');
const requiredDeps = [
  'next-auth',
  'bcryptjs', 
  '@types/bcryptjs',
  'zod',
  '@prisma/client'
];

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  for (const dep of requiredDeps) {
    if (allDeps[dep]) {
      console.log(`   ✓ ${dep} installed (${allDeps[dep]})`);
    } else {
      console.log(`   ✗ ${dep} missing`);
    }
  }
} catch (error) {
  console.log('   ✗ Could not read package.json');
}

// Test 3: Check if authentication files exist
console.log('\n3. Authentication Files:');
const authFiles = [
  'src/auth.ts',
  'src/app/api/auth/register/route.ts',
  'src/app/auth/signin/page.tsx',
  'src/app/auth/register/page.tsx',
  'src/middleware.ts'
];

for (const file of authFiles) {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file} exists`);
  } else {
    console.log(`   ✗ ${file} missing`);
  }
}

// Test 4: Check Prisma schema
console.log('\n4. Database Schema:');
try {
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  if (schema.includes('password      String?')) {
    console.log('   ✓ User model has password field');
  } else {
    console.log('   ✗ User model missing password field');
  }
  
  if (schema.includes('model Account')) {
    console.log('   ✓ NextAuth Account model exists');
  } else {
    console.log('   ✗ NextAuth Account model missing');
  }
} catch (error) {
  console.log('   ✗ Could not read Prisma schema');
}

// Test 5: TypeScript compilation
console.log('\n5. TypeScript Compilation:');
try {
  execSync('npx tsc --noEmit', { stdio: 'ignore' });
  console.log('   ✓ TypeScript compilation successful');
} catch (error) {
  console.log('   ✗ TypeScript compilation failed');
}

// Test 6: ESLint check
console.log('\n6. ESLint Check:');
try {
  execSync('npm run lint', { stdio: 'ignore' });
  console.log('   ✓ ESLint passed');
} catch (error) {
  console.log('   ✗ ESLint failed');
}

// Test 7: Build test
console.log('\n7. Production Build:');
try {
  execSync('npm run build', { stdio: 'ignore' });
  console.log('   ✓ Production build successful');
} catch (error) {
  console.log('   ✗ Production build failed');
}

console.log('\n🎯 Authentication setup verification complete!');
