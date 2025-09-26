const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Failed to hash password');
  }
}

/**
 * Compare a password with its hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} - True if password matches
 */
async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Failed to compare password');
  }
}

/**
 * Hash a refresh token
 * @param {string} token - Plain text token
 * @returns {Promise<string>} - Hashed token
 */
async function hashToken(token) {
  try {
    return await bcrypt.hash(token, SALT_ROUNDS);
  } catch (error) {
    throw new Error('Failed to hash token');
  }
}

/**
 * Compare a token with its hash
 * @param {string} token - Plain text token
 * @param {string} hash - Hashed token
 * @returns {Promise<boolean>} - True if token matches
 */
async function compareToken(token, hash) {
  try {
    return await bcrypt.compare(token, hash);
  } catch (error) {
    throw new Error('Failed to compare token');
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  hashToken,
  compareToken,
}; 