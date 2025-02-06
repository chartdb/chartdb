#!/bin/sh

# Replace placeholders in nginx.conf
envsubst '${OPENAI_API_KEY} ${OPENAI_API_ENDPOINT} ${LLM_MODEL_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g "daemon off;"
