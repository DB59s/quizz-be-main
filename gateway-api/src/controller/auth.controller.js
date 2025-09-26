const AppDataSource = require('../config/data-source');
const { hashPassword, comparePassword, hashToken, compareToken } = require('../utils/hash');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  getRefreshTokenExpiration,
  isRefreshTokenExpired 
} = require('../utils/jwt');
const { googleAuthService } = require('../service');
const { google } = require('googleapis');
const { 
  GOOGLE_CLIENT_ID, 
  GOOGLE_CLIENT_SECRET,
  API_BASE_URL,
  FRONTEND_URL,
  FRONTEND_PATH
} = require('../config/env');

// Initialize OAuth2 client for server-side flow
const getCallbackUrl = () => {
  return `${API_BASE_URL}/api/auth/google/callback`;
};

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  getCallbackUrl()
);

// Get repositories
const getAccountRepository = () => AppDataSource.getRepository('Account');
const getRefreshTokenRepository = () => AppDataSource.getRepository('RefreshToken');

/**
 * Register a new account
 * POST /auth/register
 */
async function register(req, res) {
  try {
    const { email, password, role = 'user' } = req.body;

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

    // Validate role
    const validRoles = ['user', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid role specified'
      });
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

    // Create account
    const newAccount = accountRepo.create({
      email,
      password_hash,
      role,
      status: 'active'
    });

    const savedAccount = await accountRepo.save(newAccount);

    // Generate tokens
    const accessToken = generateAccessToken({
      accountId: savedAccount.id,
      role: savedAccount.role
    });

    const refreshTokenRaw = generateRefreshToken();
    const refreshTokenHashed = await hashToken(refreshTokenRaw);

    // Save refresh token
    const refreshTokenRepo = getRefreshTokenRepository();
    const refreshTokenEntity = refreshTokenRepo.create({
      account_id: savedAccount.id,
      token: refreshTokenHashed,
      expires_at: getRefreshTokenExpiration()
    });

    await refreshTokenRepo.save(refreshTokenEntity);

    console.log(`New account registered: ${email} with role: ${role}`);

    // Return response
    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: savedAccount.id,
        email: savedAccount.email,
        role: savedAccount.role
      }
    });

  } catch (error) {
    console.error('Register error:', error);
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
    if (account.status !== 'active') {
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

    // Generate tokens
    const accessToken = generateAccessToken({
      accountId: account.id,
      role: account.role
    });

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

    console.log(`Account logged in: ${email}`);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: account.id,
        email: account.email,
        role: account.role
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

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      accountId: account.id,
      role: account.role
    });

    const newRefreshTokenRaw = generateRefreshToken();
    const newRefreshTokenHashed = await hashToken(newRefreshTokenRaw);

    // Save new refresh token
    const newRefreshTokenEntity = refreshTokenRepo.create({
      account_id: account.id,
      token: newRefreshTokenHashed,
      expires_at: getRefreshTokenExpiration()
    });

    await refreshTokenRepo.save(newRefreshTokenEntity);

    console.log(`Tokens refreshed for account: ${account.email}`);

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
    const { accountId } = req.user;

    const accountRepo = getAccountRepository();
    const account = await accountRepo.findOne({ where: { id: accountId } });

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
        role: 'user',
        status: 'active',
        password_hash: null // No password for Google users
      });

      account = await accountRepo.save(account);
      console.log(`New Google account created: ${googleUser.email}`);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      accountId: account.id,
      role: account.role
    });

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

    console.log(`Google login successful: ${account.email}`);

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
        provider: account.provider
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
        role: 'user',
        status: 'active',
        password_hash: null // No password for Google users
      });

      account = await accountRepo.save(account);
      console.log(`New Google account created via callback: ${googleUser.email}`);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      accountId: account.id,
      role: account.role
    });

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

    console.log(`Google callback login successful: ${account.email}`);

    
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

module.exports = {
  register,
  login,
  googleLogin,
  googleCallback,
  googleAuth,
  refresh,
  me,
}; 