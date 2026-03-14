FROM node:18-alpine AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY services/room-service/package*.json ./services/room-service/
WORKDIR /app/services/room-service
RUN npm install
COPY services/room-service/ .
RUN npx tsc

FROM node:18-alpine
WORKDIR /app
COPY services/room-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/room-service/dist ./dist
USER node
EXPOSE 3001
CMD ["sh", "-c", "node $(find dist -name index.js)"]