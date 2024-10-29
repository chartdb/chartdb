# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy source files and build the project
COPY . .
RUN npm run build

# Stage 2: Prepare the production image
FROM nginx:stable-alpine AS production

# Remove unnecessary files to reduce image size
RUN rm -rf /var/cache/apk/* /tmp/*

# Copy the build output from the builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose the default port for the Nginx web server
EXPOSE 80

# Run Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
