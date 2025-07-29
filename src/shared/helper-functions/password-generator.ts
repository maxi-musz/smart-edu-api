import * as crypto from 'crypto';

/**
 * Generates a strong password based on user information
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param email - User's email
 * @param phone - User's phone number
 * @returns {string} A strong password
 */
export function generateStrongPassword(
  firstName: string,
  lastName: string,
  email: string,
  phone: string
): string {
  // Extract parts from user information
  const firstInitial = firstName.charAt(0).toLowerCase();
  const lastInitial = lastName.charAt(0).toLowerCase();
  const lastFourDigits = phone.slice(-4);
  const emailDomain = email.split('@')[1]?.split('.')[0] || 'edu';
  
  // Create a base password with user info
  let password = `${firstInitial}${lastInitial}${lastFourDigits}${emailDomain}`;
  
  // Add special characters and numbers for strength
  const specialChars = ['@', '#', '$', '%', '&', '*', '!'];
  const randomSpecial = specialChars[crypto.randomInt(0, specialChars.length)];
  const randomNumber = crypto.randomInt(0, 10);
  
  // Insert random elements at different positions
  const insertPos = crypto.randomInt(2, password.length - 1);
  password = password.slice(0, insertPos) + randomSpecial + password.slice(insertPos);
  
  // Add a random number at the end
  password += randomNumber;
  
  // Ensure it's at least 8 characters
  if (password.length < 8) {
    password += crypto.randomInt(10, 99);
  }
  
  return password;
}

/**
 * Generates a simple password for testing purposes
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param phone - User's phone number
 * @returns {string} A simple password
 */
export function generateSimplePassword(
  firstName: string,
  lastName: string,
  phone: string
): string {
  const firstInitial = firstName.charAt(0).toLowerCase();
  const lastInitial = lastName.charAt(0).toLowerCase();
  const lastFourDigits = phone.slice(-4);
  
  return `${firstInitial}${lastInitial}${lastFourDigits}@2024`;
}

/**
 * Validates password strength
 * @param password - Password to validate
 * @returns {boolean} True if password meets strength requirements
 */
export function validatePasswordStrength(password: string): boolean {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= 8;
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
} 