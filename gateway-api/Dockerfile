# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Create production environment file
RUN echo 'NODE_ENV=production' > .env.production && \
    echo 'PORT=3000' >> .env.production && \
    echo 'DB_TYPE=mysql' >> .env.production && \
    echo 'DB_HOST=mysql' >> .env.production && \
    echo 'DB_PORT=3306' >> .env.production && \
    echo 'DB_USERNAME=gateway_user' >> .env.production && \
    echo 'DB_PASSWORD=gateway_password' >> .env.production && \
    echo 'DB_DATABASE=gateway_db' >> .env.production && \
    echo 'DB_SYNCHRONIZE=true' >> .env.production && \
    echo 'DB_LOGGING=false' >> .env.production && \
    echo 'USER_SERVICE_BASEURL=http://user-service-api:3000' >> .env.production && \
    echo 'USER_SERVICE_API_TOKEN=user_service_secret_token_2024' >> .env.production && \
    echo 'JWT_SECRET=your-super-secret-jwt-key-change-this-in-production' >> .env.production && \
    echo 'JWT_EXPIRES_IN=15m' >> .env.production && \
    echo 'REFRESH_TOKEN_EXPIRES_DAYS=7' >> .env.production && \
    echo 'API_BASE_URL=https://api.vuquangduy.io.vn' >> .env.production && \
    echo 'FRONTEND_URL=https://api.vuquangduy.io.vn' >> .env.production && \
    echo 'PRODUCTION_DOMAIN=api.vuquangduy.io.vn' >> .env.production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership of the app directory to nodeuser
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose the port the app runs on
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/server.js"]
