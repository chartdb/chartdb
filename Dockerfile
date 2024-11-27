FROM node:22-alpine AS builder

ARG VITE_OPENAI_API_KEY

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# Use a lightweight web server to serve the production build
FROM nginx:stable-alpine AS production

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY ./default.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose the default port for the Nginx web server
EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
