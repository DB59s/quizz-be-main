// Export all services
const googleAuthService = require('./googleAuth.service');
const emailService = require('./email.service');
const otpService = require('./otp.service');

module.exports = {
  googleAuthService,
  emailService,
  otpService
};
