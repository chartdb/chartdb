FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production

COPY dist/ ./dist/

ENV PORT=3710
EXPOSE 3710

VOLUME ["/app/data"]
ENV COLLAB_DB_PATH=/app/data/collab.db

CMD ["node", "dist/index.js"]
