# Use Node.js LTS version
FROM node:18-alpine

# Set timezone to Vietnam (UTC+7)
RUN apk add --no-cache tzdata
ENV TZ=Asia/Ho_Chi_Minh

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy application files
COPY . .

# Expose port
EXPOSE 9010

# Start the application
CMD ["npm", "start"]
