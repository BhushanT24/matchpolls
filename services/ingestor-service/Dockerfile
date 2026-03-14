FROM node:18-alpine AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY services/ingestor-service/package*.json ./services/ingestor-service/
WORKDIR /app/services/ingestor-service
RUN npm install
COPY services/ingestor-service/ .
RUN npx tsc

FROM node:18-alpine
WORKDIR /app
COPY services/ingestor-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/ingestor-service/dist ./dist
USER node
EXPOSE 3000
CMD ["sh", "-c", "node $(find dist -name index.js)"]