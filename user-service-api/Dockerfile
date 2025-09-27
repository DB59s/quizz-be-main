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
RUN echo 'NODE_ENV=production' > .env && \
    echo 'PORT=3000' >> .env && \
    echo 'MONGO_URI=mongodb://admin:adminpassword@mongodb:27017/user_service?authSource=admin' >> .env && \
    echo 'API_PREFIX=/api/v1' >> .env && \
    echo 'API_TOKEN=45f65we46f5ew465few465we46fwe46f4ew65f46w5e4f65we4f65ew46few465f' >> .env

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
CMD ["npm", "run", "start"]
