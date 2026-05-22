# Backend multistage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
# Use npm ci when possible and allow lifecycle scripts to run as root to avoid permission issues
RUN npm ci --unsafe-perm --no-audit --no-fund || npm install --unsafe-perm

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/dist ./dist

# Install production dependencies only
RUN npm ci --production --no-audit --no-fund || npm install --production --no-audit --no-fund

EXPOSE 3000
CMD ["node", "dist/index.js"]
