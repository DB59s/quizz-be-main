const AppDataSource = require('../config/data-source');
const { hashPassword, comparePassword, hashToken, compareToken } = require('../utils/hash');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  getRefreshTokenExpiration,
  isRefreshTokenExpired 
} = require('../utils/jwt');
const { googleAuthService, emailService, otpService } = require('../service');
const { callUserService } = require('../middlewares/gateway.middleware');
const { google } = require('googleapis');
const { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET,
  API_BASE_URL,
  FRONTEND_URL,
  FRONTEND_PATH
} = require('../config/env');
const { ROLES, ACCOUNT_STATUS } = require('../utils/constants');

// Initialize OAuth2 client for server-side flow
const getCallbackUrl = () => {
  return `${API_BASE_URL}/api/v1/auth/google/callback`;
};

console.log("API_BASE_URL là: ", API_BASE_URL);

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  getCallbackUrl()
);

// Get repositories
const getAccountRepository = () => AppDataSource.getRepository('Account');
const getRefreshTokenRepository = () => AppDataSource.getRepository('RefreshToken');
const getPasswordResetRepository = () => AppDataSource.getRepository('PasswordReset');

/**
 * Register a new account
 * POST /auth/register
 */
async function register(req, res) {
  let savedAccount = null;
  
  try {
    const { email, password, phone_number,  role, full_name, student_code, department, university } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid email format'
      });
    }

    // Validate password length
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Validate role (default to student if not provided)
    const userRole = role ? role.toLowerCase() : ROLES.STUDENT;
    
    if (![ROLES.STUDENT, ROLES.TEACHER].includes(userRole)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid role. Only student and teacher registration is allowed'
      });
    }

    // Validate full_name (required for all registrations)
    if (!full_name) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Full name is required'
      });
    }

    // Validate phone_number (required for all registrations)
    if (!phone_number) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Phone number is required'
      });
    }

    // Validate phone_number format
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid phone number format'
      });
    }

    // Role-specific validation
    if (userRole === ROLES.STUDENT) {
      if (!student_code) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Student code is required for student registration'
        });
      }
    } else if (userRole === ROLES.TEACHER) {
      if (!department) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Department is required for teacher registration'
        });
      }
    }

    const accountRepo = getAccountRepository();

    // Check if email already exists
    const existingAccount = await accountRepo.findOne({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({
        success: false,
        error: 'Email already exists',
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Determine account status based on role
    // const accountStatus = userRole === ROLES.TEACHER ? ACCOUNT_STATUS.PENDING : ACCOUNT_STATUS.ACTIVE;

    const accountStatus = ACCOUNT_STATUS.ACTIVE;

    // Create account
    const newAccount = accountRepo.create({
      email,
      password_hash,
      role: userRole,
      status: accountStatus
    });

    savedAccount = await accountRepo.save(newAccount);
    console.log(`New account created: ${email} with ID: ${savedAccount.id}, role: ${userRole}, status: ${accountStatus}`);

    // Prepare user service data based on role
    const userServiceData = {
      account_id: savedAccount.id,
      email: savedAccount.email,
      role: savedAccount.role,
      full_name: full_name,
      phone_number: phone_number
    };

    if (userRole === ROLES.STUDENT) {
      userServiceData.student_code = student_code;
    } else if (userRole === ROLES.TEACHER) {
      userServiceData.department = department;
      userServiceData.university = university;
    }

    // Create user in user service
    try {
      const userServiceResponse = await callUserService('POST', '/users', userServiceData);
      console.log(`User created in user service for account: ${savedAccount.id}`);
    } catch (serviceError) {
      console.error(`Failed to create user in user service:`, serviceError.message);
      
      // Rollback: Delete the account from gateway
      await accountRepo.remove(savedAccount);
      console.log(`Rolled back account creation for: ${email}`);
      
      return res.status(500).json({
        success: false,
        error: 'User creation failed',
        message: serviceError.response?.message || 'Failed to create user profile. Please try again.'
      });
    }

    // Registration successful message based on account status
    const message = accountStatus === ACCOUNT_STATUS.PENDING
      ? 'Teacher account registered successfully. Your account is pending admin approval.'
      : 'Account registered successfully';

    console.log(`Registration completed successfully: ${email} with role: ${userRole}, status: ${accountStatus}`);

    // Return response without tokens
    res.status(201).json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Register error:', error);
    
    // Additional rollback if something went wrong after user service call
    if (savedAccount) {
      try {
        const accountRepo = getAccountRepository();
        await accountRepo.remove(savedAccount);
        console.log(`Emergency rollback completed for account: ${savedAccount.id}`);
      } catch (rollbackError) {
        console.error('Failed to rollback account:', rollbackError);
      }
    }
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to register account'
    });
  }
}

/**
 * Login with email and password
 * POST /auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Email and password are required'
      });
    }

    const accountRepo = getAccountRepository();

    // Find account by email
    const account = await accountRepo.findOne({ where: { email } });
    if (!account) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check account status
    if (account.status === ACCOUNT_STATUS.PENDING) {
      return res.status(401).json({
        success: false,
        error: 'Account pending approval',
        message: 'Your account is pending admin approval. Please wait for approval before logging in.'
      });
    }

    if (account.status !== ACCOUNT_STATUS.ACTIVE) {
      return res.status(401).json({
        success: false,
        error: 'Account disabled',
        message: 'Account is banned or deleted'
      });
    }

    // Check if account was created with Google (no password)
    if (!account.password_hash && account.provider === 'google') {
      return res.status(401).json({
        success: false,
        error: 'Google account detected',
        message: 'This account was created with Google. Please use Google login.'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, account.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    console.log("account là   " , account)

    // Get user info from user service to retrieve student_id or teacher_id
    let userId = null;
    try {
      const userResponse = await callUserService('GET', `/${account.role}/${account.id}`);
      const userData = userResponse?.data?.data;

      
      if (userData) {
        userId = userData._id
        userName = userData.full_name
      }
    } catch (serviceError) {
      console.error(`Failed to get user info from user service:`, serviceError.message);
      return res.status(500).json({
        success: false,
        error: 'User service error',
        message: 'Failed to retrieve user information'
      });
    }

    if (!userId) {
      return res.status(500).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found in user service'
      });
    }

    // Generate tokens with user_id (student_id or teacher_id)
    const tokenPayload = {
      account_id: account.id,
      role: account.role,
      user_id: userId
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenRaw = generateRefreshToken();
    const refreshTokenHashed = await hashToken(refreshTokenRaw);

    // Save refresh token
    const refreshTokenRepo = getRefreshTokenRepository();
    const refreshTokenEntity = refreshTokenRepo.create({
      account_id: account.id,
      token: refreshTokenHashed,
      expires_at: getRefreshTokenExpiration()
    });

    await refreshTokenRepo.save(refreshTokenEntity);

    console.log(`Account logged in: ${email} with user_id: ${userId}`);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        user_id: userId,
        full_name: userName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
}

/**
 * Refresh access token using refresh token
 * POST /auth/refresh
 */
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Refresh token is required'
      });
    }

    const refreshTokenRepo = getRefreshTokenRepository();
    const accountRepo = getAccountRepository();

    // Find all refresh tokens (we need to check against hashed versions)
    const refreshTokens = await refreshTokenRepo.find({
      relations: ['account']
    });

    let validRefreshToken = null;
    let account = null;

    // Check each token by comparing hash
    for (const tokenRecord of refreshTokens) {
      try {
        const isValidToken = await compareToken(refreshToken, tokenRecord.token);
        if (isValidToken) {
          // Check if token is expired
          if (isRefreshTokenExpired(tokenRecord.expires_at)) {
            // Remove expired token
            await refreshTokenRepo.remove(tokenRecord);
            break;
          }
          
          validRefreshToken = tokenRecord;
          account = tokenRecord.account;
          break;
        }
      } catch (error) {
        // Continue checking other tokens if comparison fails
        continue;
      }
    }

    if (!validRefreshToken || !account) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }

    // Check account status
    if (account.status !== 'active') {
      // Remove the refresh token for inactive account
      await refreshTokenRepo.remove(validRefreshToken);
      return res.status(401).json({
        success: false,
        error: 'Account disabled',
        message: 'Account is banned or deleted'
      });
    }

    // Token rotation: Remove old refresh token
    await refreshTokenRepo.remove(validRefreshToken);

    // Get user info from user service to retrieve student_id or teacher_id
    let userId = null;
    try {
      console.log(account)
      const userResponse = await callUserService('GET', `/${account.role}s/${account.id}`);
      const userData = userResponse?.data?.data;
      
      if (userData) {
        userId = account.role === ROLES.STUDENT ? userData.student_id : userData.teacher_id;
      }
    } catch (serviceError) {
      console.error(`Failed to get user info from user service during refresh:`, serviceError.message);
      return res.status(500).json({
        success: false,
        error: 'User service error',
        message: 'Failed to retrieve user information'
      });
    }

    if (!userId) {
      return res.status(500).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found in user service'
      });
    }

    // Generate new tokens with user_id
    const tokenPayload = {
      account_id: account.id,
      role: account.role,
      user_id: userId
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshTokenRaw = generateRefreshToken();
    const newRefreshTokenHashed = await hashToken(newRefreshTokenRaw);

    // Save new refresh token
    const newRefreshTokenEntity = refreshTokenRepo.create({
      account_id: account.id,
      token: newRefreshTokenHashed,
      expires_at: getRefreshTokenExpiration()
    });

    await refreshTokenRepo.save(newRefreshTokenEntity);

    console.log(`Tokens refreshed for account: ${account.email} with user_id: ${userId}`);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Tokens refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenRaw
    });

  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to refresh token'
    });
  }
}

/**
 * Get current user information
 * GET /auth/me
 */
async function me(req, res) {
  try {
    const { account_id } = req.user;

    const accountRepo = getAccountRepository();
    const account = await accountRepo.findOne({ where: { id: account_id } });

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: 'Account does not exist'
      });
    }

    // Return account information (without password)
    res.status(200).json({
      success: true,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        status: account.status,
        created_at: account.created_at,
        updated_at: account.updated_at
      }
    });

  } catch (error) {
    console.error('Me endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get user information'
    });
  }
}

/**
 * Google OAuth login
 * POST /auth/google
 */
async function googleLogin(req, res) {
  try {
    const { googleToken, tokenType = 'access_token' } = req.body;

    // Validate input
    if (!googleToken) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Google token is required'
      });
    }

    let googleUser;
    
    try {
      // Verify Google token and get user info
      if (tokenType === 'id_token') {
        googleUser = await googleAuthService.verifyGoogleIdToken(googleToken);
      } else {
        googleUser = await googleAuthService.verifyGoogleToken(googleToken);
      }
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Google token',
        message: 'Failed to verify Google token'
      });
    }

    const accountRepo = getAccountRepository();

    // Check if account already exists by email or google_id
    let account = await accountRepo.findOne({ 
      where: [
        { email: googleUser.email },
        { google_id: googleUser.google_id }
      ]
    });

    if (account) {
      // Account exists, update Google ID if not set
      if (!account.google_id && account.provider === 'local') {
        account.google_id = googleUser.google_id;
        account.provider = 'google';
        await accountRepo.save(account);
      }
      
      // Check account status
      if (account.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Account disabled',
          message: 'Account is banned or deleted'
        });
      }
    } else {
      // Create new account with Google info
      account = accountRepo.create({
        email: googleUser.email,
        google_id: googleUser.google_id,
        provider: 'google',
        role: 'student',
        status: 'active',
        password_hash: null // No password for Google users
      });

      account = await accountRepo.save(account);
      console.log(`New Google account created: ${googleUser.email} with ID: ${account.id}`);

      // For Google login, we don't have full_name and student_code
      // The user will need to complete their profile later
      // We create a basic student record with null student_code to avoid unique constraint issues
      try {
        const userServiceResponse = await callUserService('POST', '/users', {
          account_id: account.id,
          email: account.email,
          role: account.role,
          full_name: googleUser.name || '',
          student_code: null // Will be set later by user, null allows multiple Google users
        });

        console.log(`User created in user service for Google account: ${account.id}`);
      } catch (serviceError) {
        console.error(`Failed to create user in user service for Google account:`, serviceError.message);
        
        // Rollback: Delete the account from gateway
        await accountRepo.remove(account);
        console.log(`Rolled back Google account creation for: ${googleUser.email}`);
        
        return res.status(500).json({
          success: false,
          error: 'User creation failed',
          message: serviceError.response?.message || 'Failed to create user profile. Please try again.'
        });
      }
    }

    // Get user info from user service to retrieve student_id or teacher_id
    let userId = null;
    try {
      const userResponse = await callUserService('GET', `/${account.role}s/${account.id}`);
      const userData = userResponse?.data?.data;
      
      if (userData) {
        userId = account.role === ROLES.STUDENT ? userData.student_id : userData.teacher_id;
      }
    } catch (serviceError) {
      console.error(`Failed to get user info from user service for Google login:`, serviceError.message);
      return res.status(500).json({
        success: false,
        error: 'User service error',
        message: 'Failed to retrieve user information'
      });
    }

    if (!userId) {
      return res.status(500).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found in user service'
      });
    }

    // Generate tokens with user_id
    const tokenPayload = {
      account_id: account.id,
      role: account.role,
      user_id: userId
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenRaw = generateRefreshToken();
    const refreshTokenHashed = await hashToken(refreshTokenRaw);

    // Save refresh token
    const refreshTokenRepo = getRefreshTokenRepository();
    const refreshTokenEntity = refreshTokenRepo.create({
      account_id: account.id,
      token: refreshTokenHashed,
      expires_at: getRefreshTokenExpiration()
    });

    await refreshTokenRepo.save(refreshTokenEntity);

    console.log(`Google login successful: ${account.email} with user_id: ${userId}`);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: account.id,
        email: account.email,
        role: account.role,
        provider: account.provider,
        user_id: userId
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process Google login'
    });
  }
}

/**
 * Google OAuth callback (for server-side flow)
 * GET /auth/google/callback
 */
async function googleCallback(req, res) {
  try {
    const { code, state, error } = req.query;

    // Handle OAuth error
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'OAuth error',
        message: `Google OAuth failed: ${error}`
      });
    }

    // Validate authorization code
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
        message: 'Authorization code is required'
      });
    }

    let tokens;
    try {
      // Exchange authorization code for tokens
      const { tokens: googleTokens } = await oauth2Client.getToken(code);
      tokens = googleTokens;
      
      // Set credentials to get user info
      oauth2Client.setCredentials(tokens);
    } catch (error) {
      console.error('Token exchange error:', error);
      return res.status(400).json({
        success: false,
        error: 'Token exchange failed',
        message: 'Failed to exchange authorization code for tokens'
      });
    }

    let googleUser;
    try {
      // Get user info using access token
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      if (!data || !data.email) {
        throw new Error('Missing user email from Google');
      }
      
      googleUser = {
        google_id: data.id,
        email: data.email,
        name: data.name,
        picture: data.picture,
        verified_email: data.verified_email
      };
    } catch (error) {
      console.error('User info fetch error:', error);
      return res.status(400).json({
        success: false,
        error: 'Failed to get user info',
        message: 'Could not retrieve user information from Google'
      });
    }

    const accountRepo = getAccountRepository();

    // Check if account already exists by email or google_id
    let account = await accountRepo.findOne({ 
      where: [
        { email: googleUser.email },
        { google_id: googleUser.google_id }
      ]
    });

    if (account) {
      // Account exists, update Google ID if not set
      if (!account.google_id && account.provider === 'local') {
        account.google_id = googleUser.google_id;
        account.provider = 'google';
        await accountRepo.save(account);
      }
      
      // Check account status
      if (account.status !== 'active') {
        return res.status(401).json({
          success: false,
          error: 'Account disabled',
          message: 'Account is banned or deleted'
        });
      }
    } else {
      // Create new account with Google info
      account = accountRepo.create({
        email: googleUser.email,
        google_id: googleUser.google_id,
        provider: 'google',
        role: 'student',
        status: 'active',
        password_hash: null // No password for Google users
      });

      account = await accountRepo.save(account);
      console.log(`New Google account created via callback: ${googleUser.email} with ID: ${account.id}`);

      // For Google login, we don't have full_name and student_code
      // The user will need to complete their profile later
      try {
        const userServiceResponse = await callUserService('POST', '/users', {
          account_id: account.id,
          email: account.email,
          role: account.role,
          full_name: googleUser.name || '',
          student_code: null // Will be set later by user, null allows multiple Google users
        });

        console.log(`User created in user service for Google callback account: ${account.id}`);
      } catch (serviceError) {
        console.error(`Failed to create user in user service for Google callback:`, serviceError.message);
        
        // Rollback: Delete the account from gateway
        await accountRepo.remove(account);
        console.log(`Rolled back Google callback account creation for: ${googleUser.email}`);
        
        return res.status(500).json({
          success: false,
          error: 'User creation failed',
          message: serviceError.response?.message || 'Failed to create user profile. Please try again.'
        });
      }
    }

    // Get user info from user service to retrieve student_id or teacher_id
    let userId = null;
    try {
      const userResponse = await callUserService('GET', `/${account.role}s/${account.id}`);
      const userData = userResponse?.data?.data;
      
      if (userData) {
        userId = account.role === ROLES.STUDENT ? userData.student_id : userData.teacher_id;
      }
    } catch (serviceError) {
      console.error(`Failed to get user info from user service for Google callback:`, serviceError.message);
      return res.status(500).json({
        success: false,
        error: 'User service error',
        message: 'Failed to retrieve user information'
      });
    }

    if (!userId) {
      return res.status(500).json({
        success: false,
        error: 'User not found',
        message: 'User profile not found in user service'
      });
    }

    // Generate tokens with user_id
    const tokenPayload = {
      account_id: account.id,
      role: account.role,
      user_id: userId
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshTokenRaw = generateRefreshToken();
    const refreshTokenHashed = await hashToken(refreshTokenRaw);

    // Save refresh token
    const refreshTokenRepo = getRefreshTokenRepository();
    const refreshTokenEntity = refreshTokenRepo.create({
      account_id: account.id,
      token: refreshTokenHashed,
      expires_at: getRefreshTokenExpiration()
    });

    await refreshTokenRepo.save(refreshTokenEntity);

    console.log(`Google callback login successful: ${account.email} with user_id: ${userId}`);

    
    const redirectUrl = `https://vuquangduy.online`;
    
    res.redirect(redirectUrl);

  } catch (error) {
    console.error('Google callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process Google OAuth callback'
    });
  }
}

/**
 * Initiate Google OAuth (for server-side flow)
 * GET /auth/google
 */
async function googleAuth(req, res) {
  try {
    // Generate the Google OAuth URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
      include_granted_scopes: true,
    });

    res.json({
      success: true,
      authUrl,
      message: 'Redirect to this URL to start Google OAuth'
    });

  } catch (error) {
    console.error('Google auth initiation error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to initiate Google OAuth'
    });
  }
}

/**
 * Request password reset with OTP
 * POST /auth/forgot-password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const accountRepo = getAccountRepository();
    const passwordResetRepo = getPasswordResetRepository();

    // Clean expired OTP records before processing
    await otpService.cleanExpiredOTPs(passwordResetRepo);

    // Check if account exists (but don't reveal this information)
    const account = await accountRepo.findOne({ where: { email } });
    
    // Always return the same response regardless of whether email exists
    const response = {
      success: true,
      message: 'If an account with this email exists, an OTP has been sent to your email address. Please check your inbox.'
    };

    // If account exists and is active, proceed with OTP generation
    if (account && account.status === 'active') {
      // Check if account is a Google account without password
      if (!account.password_hash && account.provider === 'google') {
        // For Google accounts, we still send the standard response
        // but don't actually send an OTP
        console.log(`Forgot password request for Google account: ${email}`);
        return res.status(200).json(response);
      }

      // Remove any existing unused OTP for this email
      const existingResets = await passwordResetRepo.find({
        where: { email, used: false }
      });
      
      if (existingResets.length > 0) {
        await passwordResetRepo.remove(existingResets);
      }

      // Generate OTP
      const otp = otpService.generateOTP();
      const otpHash = await otpService.hashOTP(otp);
      const expiresAt = otpService.getOTPExpiration();

      // Save OTP to database
      const passwordReset = passwordResetRepo.create({
        email,
        otp_hash: otpHash,
        expires_at: expiresAt,
        used: false,
        otp_verified: false
      });

      await passwordResetRepo.save(passwordReset);

      // Send OTP via email
      try {
        await emailService.sendOTPEmail(email, otp);
        console.log(`OTP sent successfully to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send OTP email to ${email}:`, emailError);
        // Remove the OTP record if email sending failed
        await passwordResetRepo.remove(passwordReset);
        
        return res.status(500).json({
          success: false,
          error: 'Email service error',
          message: 'Failed to send OTP email. Please try again later.'
        });
      }
    } else {
      // Account doesn't exist or is not active, but we still return success message
      console.log(`Forgot password request for non-existent or inactive account: ${email}`);
    }

    // Return success response in all cases
    res.status(200).json(response);

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process forgot password request'
    });
  }
}

/**
 * Verify OTP for password reset
 * POST /auth/verify-otp
 */
async function verifyOTP(req, res) {
  try {
    const { email, otp } = req.body;

    const passwordResetRepo = getPasswordResetRepository();

    // Find the most recent unused OTP for this email
    const passwordReset = await passwordResetRepo.findOne({
      where: { email, used: false },
      order: { created_at: 'DESC' }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        message: 'No valid OTP found for this email address'
      });
    }

    // Check if OTP is expired
    if (otpService.isOTPExpired(passwordReset.expires_at)) {
      // Remove expired OTP
      await passwordResetRepo.remove(passwordReset);
      
      return res.status(400).json({
        success: false,
        error: 'OTP expired',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    const isValidOTP = await otpService.verifyOTP(otp, passwordReset.otp_hash);
    
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        message: 'The OTP you entered is incorrect'
      });
    }

    // Mark OTP as verified (but not used yet)
    passwordReset.otp_verified = true;
    await passwordResetRepo.save(passwordReset);

    console.log(`OTP verified successfully for ${email}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.',
      otp_verified: true
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify OTP'
    });
  }
}

/**
 * Reset password after OTP verification
 * POST /auth/reset-password
 */
async function resetPassword(req, res) {
  try {
    const { email, newPassword } = req.body;

    const accountRepo = getAccountRepository();
    const passwordResetRepo = getPasswordResetRepository();

    // Find verified but unused OTP for this email
    const passwordReset = await passwordResetRepo.findOne({
      where: { 
        email, 
        used: false, 
        otp_verified: true 
      },
      order: { created_at: 'DESC' }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'No verified OTP found. Please verify your OTP first.'
      });
    }

    // Check if OTP is expired
    if (otpService.isOTPExpired(passwordReset.expires_at)) {
      // Remove expired OTP
      await passwordResetRepo.remove(passwordReset);
      
      return res.status(400).json({
        success: false,
        error: 'OTP expired',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Find account
    const account = await accountRepo.findOne({ where: { email } });
    
    if (!account) {
      // Remove the OTP record
      await passwordResetRepo.remove(passwordReset);
      
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: 'Account does not exist'
      });
    }

    // Check account status
    if (account.status !== 'active') {
      // Remove the OTP record
      await passwordResetRepo.remove(passwordReset);
      
      return res.status(400).json({
        success: false,
        error: 'Account disabled',
        message: 'Account is banned or deleted'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update account password
    account.password_hash = newPasswordHash;
    // If this was a Google account without password, change provider to local
    if (account.provider === 'google' && !account.password_hash) {
      account.provider = 'local';
    }
    
    await accountRepo.save(account);

    // Mark OTP as used
    passwordReset.used = true;
    await passwordResetRepo.save(passwordReset);

    console.log(`Password reset successfully for ${email}`);

    // Send success notification email
    try {
      await emailService.sendPasswordResetSuccessEmail(email);
    } catch (emailError) {
      console.error(`Failed to send password reset success email to ${email}:`, emailError);
      // Don't fail the request if notification email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to reset password'
    });
  }
}

/**
 * Logout user by invalidating refresh token
 * POST /auth/logout
 */
async function logout(req, res) {
  try {
    const { refreshToken } = req.body;

    // If no refresh token provided, still return success (user might have already cleared local storage)
    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    }

    const refreshTokenRepo = getRefreshTokenRepository();

    // Find all refresh tokens (we need to check against hashed versions)
    const refreshTokens = await refreshTokenRepo.find();

    let validRefreshToken = null;

    // Check each token by comparing hash
    for (const tokenRecord of refreshTokens) {
      try {
        const isValidToken = await compareToken(refreshToken, tokenRecord.token);
        if (isValidToken) {
          validRefreshToken = tokenRecord;
          break;
        }
      } catch (error) {
        // Continue checking other tokens if comparison fails
        continue;
      }
    }

    // If valid refresh token found, remove it
    if (validRefreshToken) {
      await refreshTokenRepo.remove(validRefreshToken);
      console.log(`Refresh token invalidated for account: ${validRefreshToken.account_id}`);
    }

    // Always return success (even if token not found - user might have already logged out)
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to logout'
    });
  }
}

/**
 * Change password for authenticated user
 * POST /auth/change-password
 */
async function changePassword(req, res) {
  try {
    const { account_id } = req.user; // From verifyToken middleware
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Old password, new password, and confirm new password are required'
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'New password must be at least 6 characters long'
      });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'New password and confirm password do not match'
      });
    }

    // Check if new password is same as old password
    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'New password must be different from old password'
      });
    }

    const accountRepo = getAccountRepository();

    // Find account
    const account = await accountRepo.findOne({ where: { id: account_id } });
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
        message: 'Account does not exist'
      });
    }

    // Check if account has a password (not Google OAuth only)
    if (!account.password_hash) {
      return res.status(400).json({
        success: false,
        error: 'No password set',
        message: 'This account uses Google login and does not have a password. Please use Google to sign in.'
      });
    }

    // Verify old password
    const isOldPasswordValid = await comparePassword(oldPassword, account.password_hash);
    if (!isOldPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password',
        message: 'Old password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update account password
    account.password_hash = newPasswordHash;
    await accountRepo.save(account);

    console.log(`Password changed successfully for account: ${account.email}`);

    // Send success notification email (optional)
    try {
      await emailService.sendPasswordChangeNotificationEmail(account.email);
    } catch (emailError) {
      console.error(`Failed to send password change notification email to ${account.email}:`, emailError);
      // Don't fail the request if notification email fails
    }

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to change password'
    });
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  googleCallback,
  googleAuth,
  refresh,
  me,
  logout,
  forgotPassword,
  verifyOTP,
  resetPassword,
  changePassword
};