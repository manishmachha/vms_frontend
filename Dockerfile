# Multi-stage Dockerfile for Angular Frontend with Nginx
# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files first (for layer caching)
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Stage 2: Runtime with Nginx
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy the repo nginx.conf for proper MFE CORS headers
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built Angular app to nginx html directory
# Angular 21 with ngx-build-plus may output to dist/<project>/browser/ or dist/<project>/
COPY --from=build /app/dist/vms_frontend /tmp/angular-build

RUN if [ -d "/tmp/angular-build/browser" ]; then \
      cp -r /tmp/angular-build/browser/* /usr/share/nginx/html/; \
    else \
      cp -r /tmp/angular-build/* /usr/share/nginx/html/; \
    fi && \
    rm -rf /tmp/angular-build

# Ensure proper permissions for the nginx user
RUN chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
