# ---------- Build stage ----------
FROM node:24-slim AS builder

# Build server
WORKDIR /build/server

COPY server/package.json ./
COPY server/tsconfig.json ./
COPY server/src ./src

RUN npm install
RUN npm run build

# Build client
WORKDIR /build/client

COPY client/package.json ./
COPY client/tsconfig.json ./
COPY client/*.js ./
COPY client/*.ts ./
COPY client/*.html ./
COPY client/src ./src

RUN npm install
RUN npm run build

# ---------- Runtime stage ----------
FROM node:24-slim

WORKDIR /app

# Server runtime dependencies
COPY server/package.json ./

RUN npm install --omit=dev

# Built server output
COPY --from=builder /build/server/src ./src

# Built client output
COPY --from=builder /build/client/dist ./client-dist

EXPOSE 3001

CMD ["node", "src/index.js"]