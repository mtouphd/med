# Build stage for backend
FROM node:18-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# Build stage for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

RUN apk add --no-cache nginx bash

# Copy backend
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package.json ./backend/package.json
COPY --from=backend-builder /app/backend/tsconfig.json ./backend/tsconfig.json

# Copy frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/package.json
COPY --from=frontend-builder /app/frontend/next.config.js ./frontend/next.config.js
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["sh", "/app/start.sh"]
