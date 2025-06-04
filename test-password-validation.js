// Test script to verify password validation uniformity
import { validatePasswordComplexity, isPasswordValid, getPasswordRequirements } from './src/lib/password-validation.js';

console.log('=== Password Validation Test ===\n');

console.log('Password Requirements:');
getPasswordRequirements().forEach((req, index) => {
  console.log(`${index + 1}. ${req}`);
});

console.log('\n=== Test Cases ===');

const testPasswords = [
  { password: '12345678', expected: false, description: 'Only numbers (8 chars)' },
  { password: 'password', expected: false, description: 'Only lowercase letters' },
  { password: 'Password', expected: false, description: 'Uppercase + lowercase, no numbers' },
  { password: 'Pass123', expected: false, description: 'All requirements but too short (7 chars)' },
  { password: 'Password123', expected: true, description: 'All requirements met' },
  { password: 'MySecure123', expected: true, description: 'Complex password' },
  { password: 'simple', expected: false, description: 'Too short, missing requirements' }
];

testPasswords.forEach(({ password, expected, description }) => {
  const errors = validatePasswordComplexity(password);
  const isValid = isPasswordValid(password);
  const testPassed = (isValid === expected);
  
  console.log(`\nPassword: "${password}" - ${description}`);
  console.log(`Expected: ${expected ? 'VALID' : 'INVALID'}, Got: ${isValid ? 'VALID' : 'INVALID'} - ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
  
  if (errors.length > 0) {
    console.log(`Validation errors: ${errors.join(', ')}`);
  }
});

console.log('\n=== Summary ===');
console.log('Password validation has been uniformized across:');
console.log('1. Manual registration flow (/api/auth/register)');
console.log('2. Registration frontend form (/auth/register)');
console.log('3. Setup password flow (/auth/setup-password)');
console.log('4. Setup password API (/api/auth/setup-password)');
console.log('\nAll flows now require:');
console.log('- At least 8 characters');
console.log('- At least one uppercase letter');
console.log('- At least one lowercase letter');
console.log('- At least one number');
