FROM node:18-alpine AS builder
WORKDIR /app
COPY tsconfig.base.json ./
COPY packages/shared/ ./packages/shared/
COPY services/poll-service/package*.json ./services/poll-service/
WORKDIR /app/services/poll-service
RUN npm install
COPY services/poll-service/ .
RUN npx tsc

FROM node:18-alpine
WORKDIR /app
COPY services/poll-service/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/services/poll-service/dist ./dist
USER node
EXPOSE 3002
CMD ["sh", "-c", "node $(find dist -name index.js)"]