FROM node:24-alpine AS builder

WORKDIR /usr/src/app

ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:24-alpine AS production

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=80
ENV CHARTDB_DATA_DIR=/data
ENV NODE_OPTIONS=

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/server ./server

EXPOSE 80

CMD ["node", "server/index.js"]
