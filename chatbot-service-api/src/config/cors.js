const cors = require('cors');

// CORS configuration - configurable via environment
const corsOrigin = process.env.CORS_ORIGIN || '*';
const corsCredentials = process.env.CORS_CREDENTIALS === 'true';

const corsOptions = {
  origin: corsOrigin === '*' ? '*' : corsOrigin.split(',').map(o => o.trim()),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: corsCredentials,
  optionsSuccessStatus: 200
};

console.log('[CORS] Configuration loaded:');
console.log(`[CORS] - Origin: ${corsOrigin}`);
console.log(`[CORS] - Credentials: ${corsCredentials}`);

module.exports = cors(corsOptions);
