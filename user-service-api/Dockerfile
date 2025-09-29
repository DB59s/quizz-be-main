# Use Node.js 18 Alpine base image
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

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
    echo 'PORT=9005' >> .env && \
    echo 'MONGO_URI=mongodb+srv://vuduy050903_db_user:3qHHYv2yylxfhHyg@cluster0.icn9gah.mongodb.net/user_service?retryWrites=true&w=majority&appName=Cluster0' >> .env && \
    echo 'API_PREFIX=/api/v1' >> .env && \
    echo 'API_TOKEN=user_service_secret_token_2024' >> .env

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership of the app directory to nodeuser
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose the port the app runs on
EXPOSE 9005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9005/', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/server.js"]
