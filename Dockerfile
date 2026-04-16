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

# Copy built Angular app to nginx html directory
COPY --from=build /app/dist/vms_ui /usr/share/nginx/html

# Ensure proper permissions for the nginx user
RUN chmod -R 755 /usr/share/nginx/html

# A robust config for Angular MFE
RUN echo "server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Explicitly include mime types \
    include /etc/nginx/mime.types; \
    types { \
        application/javascript js; \
        text/css css; \
    } \
    \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
    \
    location /health { \
        access_log off; \
        return 200 'healthy\n'; \
    } \
}" > /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
