FROM node:22-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Use a lightweight web server to serve the production build
FROM nginx:stable-alpine AS production

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Expose the default port for the Nginx web server
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
