const crypto = require('crypto');
const { hashPassword, comparePassword } = require('../utils/hash');
const { OTP_EXPIRES_MINUTES } = require('../config/env');

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
function generateOTP() {
  // Generate a random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
}

/**
 * Hash an OTP using bcrypt
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} - Hashed OTP
 */
async function hashOTP(otp) {
  try {
    return await hashPassword(otp);
  } catch (error) {
    throw new Error('Failed to hash OTP');
  }
}

/**
 * Verify an OTP against its hash
 * @param {string} otp - Plain text OTP
 * @param {string} hash - Hashed OTP
 * @returns {Promise<boolean>} - True if OTP matches
 */
async function verifyOTP(otp, hash) {
  try {
    return await comparePassword(otp, hash);
  } catch (error) {
    throw new Error('Failed to verify OTP');
  }
}

/**
 * Get OTP expiration time
 * @returns {Date} - Expiration date
 */
function getOTPExpiration() {
  const now = new Date();
  return new Date(now.getTime() + OTP_EXPIRES_MINUTES * 60 * 1000);
}

/**
 * Check if OTP is expired
 * @param {Date} expiresAt - Expiration date
 * @returns {boolean} - True if expired
 */
function isOTPExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Generate a secure temporary token for OTP verification
 * @returns {string} - Random token
 */
function generateTempToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate OTP format (6 digits)
 * @param {string} otp - OTP to validate
 * @returns {boolean} - True if valid format
 */
function isValidOTPFormat(otp) {
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp);
}

/**
 * Clean expired OTP records from database
 * @param {Repository} passwordResetRepo - Password reset repository
 * @returns {Promise<number>} - Number of cleaned records
 */
async function cleanExpiredOTPs(passwordResetRepo) {
  try {
    const { LessThan } = require('typeorm');
    
    const expiredRecords = await passwordResetRepo.find({
      where: {
        expires_at: LessThan(new Date())
      }
    });

    if (expiredRecords.length > 0) {
      await passwordResetRepo.remove(expiredRecords);
      console.log(`Cleaned ${expiredRecords.length} expired OTP records`);
    }

    return expiredRecords.length;
  } catch (error) {
    console.error('Failed to clean expired OTP records:', error);
    return 0;
  }
}

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiration,
  isOTPExpired,
  generateTempToken,
  isValidOTPFormat,
  cleanExpiredOTPs,
};
