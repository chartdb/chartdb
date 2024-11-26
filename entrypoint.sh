#!/bin/sh

# Replace placeholders in nginx.conf
envsubst '${OPENAI_API_KEY}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Start Nginx
nginx -g "daemon off;"
