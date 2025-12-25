const cors = require('cors');

// CORS configuration - allow all domains
const corsOptions = {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true // Allow cookies and credentials
};

module.exports = cors(corsOptions);
