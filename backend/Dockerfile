# Dockerfile for fragments node.js microservice
# Defines the container image for our application

# Use specific Node.js version matching your local environment
FROM node:18.13.0

# Metadata
LABEL maintainer="Your Name <your.email@example.com>"
LABEL description="Fragments node.js microservice"

# Environment variables
ENV PORT=8080
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_COLOR=false

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY ./src ./src

# Copy test files needed for basic auth
COPY ./tests/.htpasswd ./tests/.htpasswd

# Expose the application port (documentation)
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]