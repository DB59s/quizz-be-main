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
RUN echo 'NODE_ENV=production' > .env.production && \
    echo 'PORT=9008' >> .env.production && \
    echo 'DB_TYPE=mysql' >> .env.production && \
    echo 'DB_HOST=quiz_mysql' >> .env.production && \
    echo 'DB_PORT=3306' >> .env.production && \
    echo 'DB_USERNAME=question_user' >> .env.production && \
    echo 'DB_PASSWORD=question_password' >> .env.production && \
    echo 'DB_DATABASE=question_db' >> .env.production && \
    echo 'DB_SYNCHRONIZE=true' >> .env.production && \
    echo 'DB_LOGGING=false' >> .env.production

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Change ownership of the app directory to nodeuser
RUN chown -R nodeuser:nodejs /app
USER nodeuser

# Expose the port the app runs on
EXPOSE 9008

# Start the application
CMD ["node", "src/server.js"]
