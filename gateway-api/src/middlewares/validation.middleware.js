/**
 * Validation middleware for forgot password endpoints
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result with isValid and message
 */
function validatePasswordStrength(password) {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)'
    };
  }

  return {
    isValid: true,
    message: 'Password is strong'
  };
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
 * Middleware to validate forgot password request
 */
function validateForgotPasswordRequest(req, res, next) {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email is required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Normalize email to lowercase
    req.body.email = email.toLowerCase().trim();
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Validation error'
    });
  }
}

/**
 * Middleware to validate verify OTP request
 */
function validateVerifyOTPRequest(req, res, next) {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email and OTP are required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Validate OTP format
    if (!isValidOTPFormat(otp)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'OTP must be exactly 6 digits'
      });
    }

    // Normalize email to lowercase
    req.body.email = email.toLowerCase().trim();
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Validation error'
    });
  }
}

/**
 * Middleware to validate reset password request
 */
function validateResetPasswordRequest(req, res, next) {
  try {
    const { email, newPassword, confirmNewPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email, new password, and confirm password are required'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'New password and confirm password do not match'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: passwordValidation.message
      });
    }

    // Normalize email to lowercase
    req.body.email = email.toLowerCase().trim();
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Validation error'
    });
  }
}

module.exports = {
  validateForgotPasswordRequest,
  validateVerifyOTPRequest,
  validateResetPasswordRequest,
  isValidEmail,
  validatePasswordStrength,
  isValidOTPFormat,
};
