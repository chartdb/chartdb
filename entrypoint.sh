#!/bin/sh

# Replace placeholders in nginx.conf
export API_UPSTREAM="${API_UPSTREAM:-api:4010}"
export API_BASE_URL="${API_BASE_URL:-}"
envsubst '${OPENAI_API_KEY} ${OPENAI_API_ENDPOINT} ${LLM_MODEL_NAME} ${API_UPSTREAM} ${API_BASE_URL} ${HIDE_CHARTDB_CLOUD} ${DISABLE_ANALYTICS}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g "daemon off;"
