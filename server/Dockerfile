FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist/

ENV PORT=3710
EXPOSE 3710

VOLUME ["/app/data"]
ENV COLLAB_DB_PATH=/app/data/collab.db

CMD ["node", "dist/index.js"]
