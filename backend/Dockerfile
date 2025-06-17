# Use the official Node.js LTS image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app files
COPY . .

# Copy the .env file explicitly
COPY .env .env

# Expose port 8080 for our microservice
EXPOSE 8080

# Run the application
CMD ["npm", "start"]
