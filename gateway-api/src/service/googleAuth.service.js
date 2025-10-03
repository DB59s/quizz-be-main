const { google } = require('googleapis');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = require('../config/env');

console.log("Google client ID: ", GOOGLE_CLIENT_ID);
console.log("Google client secret: ", GOOGLE_CLIENT_SECRET);

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  'postmessage' // for mobile/web apps
);

/**
 * Verify Google access token and get user info
 * @param {string} accessToken - Google access token from frontend
 * @returns {Promise<Object>} User information from Google
 */
async function verifyGoogleToken(accessToken) {
  try {
    // Set credentials with the access token
    oauth2Client.setCredentials({ access_token: accessToken });
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    
    if (!data || !data.email) {
      throw new Error('Invalid Google token or missing email');
    }
    
    return {
      google_id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      verified_email: data.verified_email
    };
    
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new Error('Invalid Google token');
  }
}

/**
 * Alternative method using Google's tokeninfo endpoint
 * @param {string} idToken - Google ID token from frontend
 * @returns {Promise<Object>} User information from Google
 */
async function verifyGoogleIdToken(idToken) {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      throw new Error('Invalid Google ID token or missing email');
    }
    
    return {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      verified_email: payload.email_verified
    };
    
  } catch (error) {
    console.error('Google ID token verification error:', error);
    throw new Error('Invalid Google ID token');
  }
}

module.exports = {
  verifyGoogleToken,
  verifyGoogleIdToken
}; 