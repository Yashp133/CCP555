# Stage 1 - build
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

# Copy htpasswd file
COPY tests/.htpasswd ./tests/.htpasswd

# Stage 2 - production image
FROM node:20-slim
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
CMD ["npm", "start"]
