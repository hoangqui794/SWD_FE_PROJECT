# Build Stage
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (use ci for consistent installs)
RUN npm ci

# Copy source code
COPY . .

# Build the application
# Note: If your build relies on environment variables (like VITE_API_URL),
# you might need to pass them as ARGs here, or ensure they are present in a .env file
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
