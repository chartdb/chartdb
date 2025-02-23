FROM node:22-alpine AS builder

ARG VITE_OPENAI_API_KEY
ARG VITE_OPENAI_API_ENDPOINT
ARG VITE_LLM_MODEL_NAME
ARG VITE_HIDE_BUCKLE_DOT_DEV
ARG VITE_AUTO_LOAD_DIAGRAM

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN echo "VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}" > .env && \
    echo "VITE_OPENAI_API_ENDPOINT=${VITE_OPENAI_API_ENDPOINT}" >> .env && \
    echo "VITE_LLM_MODEL_NAME=${VITE_LLM_MODEL_NAME}" >> .env && \
    echo "VITE_HIDE_BUCKLE_DOT_DEV=${VITE_HIDE_BUCKLE_DOT_DEV}" >> .env && \
    echo "VITE_AUTO_LOAD_DIAGRAM=${VITE_AUTO_LOAD_DIAGRAM}" >> .env

RUN npm run build

FROM nginx:stable-alpine AS production

# Add volume for diagram mounting
VOLUME /diagram

# Create a directory for diagrams
RUN mkdir -p /usr/share/nginx/html/diagrams

# Copy diagrams from the build context
COPY diagrams/ /usr/share/nginx/html/diagrams/

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY ./default.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]