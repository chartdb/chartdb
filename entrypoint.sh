#!/bin/sh

# Check if diagram file exists in mounted volume
if [ -f "/diagram/diagram.json" ]; then
    # Copy the diagram file to the nginx html directory
    cp /diagram/diagram.json /usr/share/nginx/html/diagram.json
fi

# Replace placeholders in nginx.conf
envsubst '${OPENAI_API_KEY} ${OPENAI_API_ENDPOINT} ${LLM_MODEL_NAME} ${HIDE_BUCKLE_DOT_DEV}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g "daemon off;"
