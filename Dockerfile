# Use Node.js base image
FROM node:18-slim

# Install required dependencies
RUN apt-get update && \
    apt-get install -y \
    ffmpeg \
    python3 \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the project (if you have a build step)
RUN npm run build

# Expose the port your app runs on
EXPOSE 7378

# Start the application
CMD ["npm", "start"]