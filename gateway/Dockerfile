FROM node:18-alpine AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY gateway/package*.json ./gateway/
WORKDIR /app/gateway
RUN npm install
COPY gateway/ .
RUN npx tsc

FROM node:18-alpine
WORKDIR /app
COPY gateway/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/gateway/dist ./dist
USER node
EXPOSE 8080
# Path logic: rootDir is "../", so src is 1 level deep in dist
CMD ["node", "dist/src/index.js"]