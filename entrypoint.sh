#!/bin/sh

# Replace placeholders in nginx.conf
envsubst '${OPENAI_API_KEY} ${OPENAI_API_ENDPOINT} ${LLM_MODEL_NAME} ${HIDE_BUCKLE_DOT_DEV} ${MINIO_ENDPOINT} ${MINIO_USE_SSL} ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} ${MINIO_BUCKET_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g "daemon off;"
