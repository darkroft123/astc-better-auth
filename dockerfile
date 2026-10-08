FROM --platform=linux/arm64 node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm config set maxsockets 5 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-factor 20 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000 && \
    (npm ci --legacy-peer-deps --no-audit --no-fund || npm install --legacy-peer-deps --no-audit --no-fund)

COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/private.pem ./private.pem
COPY --from=builder /app/public.pem ./public.pem
ENV NODE_ENV=production
EXPOSE 3010

CMD ["node", "dist/index.js"]
