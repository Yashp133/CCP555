# Use the official Node.js LTS image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app files (INCLUDING .env)
COPY . .

# Expose port 8080 for our microservice
EXPOSE 8080

# Start the app
CMD ["npm", "start"]
