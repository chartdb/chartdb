FROM node:22-alpine AS builder

ARG VITE_OPENAI_API_KEY
ARG VITE_OPENAI_API_ENDPOINT
ARG VITE_LLM_MODEL_NAME
ARG VITE_HIDE_BUCKLE_DOT_DEV
ARG VITE_MINIO_ENDPOINT
ARG VITE_MINIO_USE_SSL
ARG VITE_MINIO_ACCESS_KEY
ARG VITE_MINIO_SECRET_KEY
ARG VITE_MINIO_BUCKET_NAME

WORKDIR /usr/src/app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN echo "VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}" > .env && \
    echo "VITE_OPENAI_API_ENDPOINT=${VITE_OPENAI_API_ENDPOINT}" >> .env && \
    echo "VITE_LLM_MODEL_NAME=${VITE_LLM_MODEL_NAME}" >> .env && \
    echo "VITE_HIDE_BUCKLE_DOT_DEV=${VITE_HIDE_BUCKLE_DOT_DEV}" >> .env && \
    echo "VITE_MINIO_ENDPOINT=${VITE_MINIO_ENDPOINT}" >> .env && \
    echo "VITE_MINIO_USE_SSL=${VITE_MINIO_USE_SSL}" >> .env && \
    echo "VITE_MINIO_ACCESS_KEY=${VITE_MINIO_ACCESS_KEY}" >> .env && \
    echo "VITE_MINIO_SECRET_KEY=${VITE_MINIO_SECRET_KEY}" >> .env && \
    echo "VITE_MINIO_BUCKET_NAME=${VITE_MINIO_BUCKET_NAME}" >> .env

RUN npm run build

FROM nginx:stable-alpine AS production

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY ./default.conf.template /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]