const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = require('../config/env');

// Create transporter for Gmail
const createTransporter = () => {
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @returns {Promise<boolean>} - Success status
 */
async function sendOTPEmail(email, otp) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Quizz Platform" <${EMAIL_USER}>`,
      to: email,
      subject: 'Mã OTP đặt lại mật khẩu - Quizz Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Quizz Platform</h1>
            <p style="color: #6b7280; margin: 5px 0;">Nền tảng học tập trực tuyến</p>
          </div>
          
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Đặt lại mật khẩu</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình. Sử dụng mã OTP bên dưới để tiếp tục:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #2563eb; color: white; padding: 15px 30px; border-radius: 6px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
                ${otp}
              </div>
            </div>
            
            <p style="color: #ef4444; font-weight: 500; text-align: center;">
              ⏰ Mã này có hiệu lực trong 5 phút
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              <strong>Lưu ý:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Mật khẩu của bạn sẽ không bị thay đổi.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 Quizz Platform. Đây là email tự động, vui lòng không trả lời.
            </p>
          </div>
        </div>
      `,
      text: `
Quizz Platform - Đặt lại mật khẩu

Mã OTP của bạn là: ${otp}

Mã này có hiệu lực trong 5 phút.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
    return true;
    
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

/**
 * Send password reset success notification email
 * @param {string} email - Recipient email
 * @returns {Promise<boolean>} - Success status
 */
async function sendPasswordResetSuccessEmail(email) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Quizz Platform" <${EMAIL_USER}>`,
      to: email,
      subject: 'Mật khẩu đã được thay đổi thành công - Quizz Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0;">Quizz Platform</h1>
            <p style="color: #6b7280; margin: 5px 0;">Nền tảng học tập trực tuyến</p>
          </div>
          
          <div style="background-color: #f0f9ff; border-radius: 8px; padding: 30px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h2 style="color: #1f2937; margin-top: 0;">✅ Mật khẩu đã được thay đổi</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Mật khẩu cho tài khoản <strong>${email}</strong> đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.
            </p>
            
            <div style="background-color: #fff; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Thông tin bảo mật:</h3>
              <ul style="color: #4b5563; line-height: 1.6;">
                <li>Nếu đây là bạn, không cần thực hiện thêm hành động nào</li>
                <li>Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức</li>
                <li>Khuyến nghị đăng nhập lại trên tất cả thiết bị</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              <strong>Lưu ý:</strong> Luôn giữ bí mật mật khẩu và không chia sẻ với bất kỳ ai.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 Quizz Platform. Đây là email tự động, vui lòng không trả lời.
            </p>
          </div>
        </div>
      `,
      text: `
Quizz Platform - Mật khẩu đã được thay đổi

Mật khẩu cho tài khoản ${email} đã được thay đổi thành công vào lúc ${new Date().toLocaleString('vi-VN')}.

Nếu không phải bạn thực hiện, vui lòng liên hệ hỗ trợ ngay lập tức.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset success email sent to ${email}. Message ID: ${info.messageId}`);
    return true;
    
  } catch (error) {
    console.error('Failed to send password reset success email:', error);
    throw new Error('Failed to send password reset success email');
  }
}

/**
 * Test email connection
 * @returns {Promise<boolean>} - Connection status
 */
async function testEmailConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email service connection verified successfully');
    return true;
  } catch (error) {
    console.error('Email service connection failed:', error);
    return false;
  }
}

module.exports = {
  sendOTPEmail,
  sendPasswordResetSuccessEmail,
  testEmailConnection,
};
