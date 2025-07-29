import * as crypto from 'crypto';

/**
 * Generates a 6-character OTP containing both numbers and letters
 * @returns {string} A 6-character alphanumeric OTP
 */
export function generateOTP(): string {
  const numbers = '0123456789';
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const allChars = numbers + letters;
  
  let otp = '';
  
  // Ensure at least one number and one letter
  otp += numbers[crypto.randomInt(0, numbers.length)];
  otp += letters[crypto.randomInt(0, letters.length)];
  
  // Fill the remaining 4 characters with random alphanumeric
  for (let i = 2; i < 6; i++) {
    otp += allChars[crypto.randomInt(0, allChars.length)];
  }
  
  // Shuffle the OTP to randomize the position of number and letter
  return otp.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generates a numeric OTP (for backward compatibility)
 * @param {number} length - Length of the OTP (default: 4)
 * @returns {string} A numeric OTP
 */
export function generateNumericOTP(length: number = 4): string {
  return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

/**
 * Validates if an OTP contains both numbers and letters
 * @param {string} otp - The OTP to validate
 * @returns {boolean} True if OTP contains both numbers and letters
 */
export function validateOTP(otp: string): boolean {
  const hasNumber = /\d/.test(otp);
  const hasLetter = /[A-Z]/.test(otp);
  return hasNumber && hasLetter && otp.length === 6;
}

// Test function (for development only)
export function testOTPGeneration(): void {
  console.log('Testing OTP Generation:');
  for (let i = 0; i < 5; i++) {
    const otp = generateOTP();
    const isValid = validateOTP(otp);
    console.log(`OTP ${i + 1}: ${otp} (Valid: ${isValid})`);
  }
} 