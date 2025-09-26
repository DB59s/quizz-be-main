const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 7;

/**
 * Generate an access token (JWT)
 * @param {Object} payload - Token payload containing accountId and role
 * @returns {string} - JWT access token
 */
function generateAccessToken(payload) {
  try {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'auth-service',
      audience: 'api-users'
    });
  } catch (error) {
    throw new Error('Failed to generate access token');
  }
}

/**
 * Verify an access token
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'auth-service',
      audience: 'api-users'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Generate a raw refresh token (random string)
 * @returns {string} - Random refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

/**
 * Calculate refresh token expiration date
 * @returns {Date} - Expiration date
 */
function getRefreshTokenExpiration() {
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);
  return expirationDate;
}

/**
 * Check if a refresh token is expired
 * @param {Date} expiresAt - Token expiration date
 * @returns {boolean} - True if token is expired
 */
function isRefreshTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

module.exports = {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiration,
  isRefreshTokenExpired,
}; 