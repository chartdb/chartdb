FROM node:24-alpine AS builder

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
COPY packages/schema-sync-core/package.json ./packages/schema-sync-core/package.json
COPY server/package.json ./server/package.json

RUN npm ci

COPY . .

RUN npm run build -w @chartdb/schema-sync-core && npm run build -w @chartdb/server

FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/server/dist ./dist
COPY --from=builder /usr/src/app/server/package.json ./package.json
COPY --from=builder /usr/src/app/packages/schema-sync-core/dist ./node_modules/@chartdb/schema-sync-core/dist
COPY --from=builder /usr/src/app/packages/schema-sync-core/package.json ./node_modules/@chartdb/schema-sync-core/package.json

EXPOSE 4010

CMD ["node", "dist/index.js"]
