# Backend multistage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
# Install deps: prefer npm ci when package-lock.json exists, fall back to npm install
RUN if [ -f package-lock.json ]; then \
			npm ci --unsafe-perm --no-audit --no-fund; \
		else \
			npm install --unsafe-perm --no-audit --no-fund; \
		fi

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/dist ./dist

# Install production dependencies only
RUN if [ -f package-lock.json ]; then \
			npm ci --production --no-audit --no-fund; \
		else \
			npm install --production --no-audit --no-fund; \
		fi

EXPOSE 3000
CMD ["node", "dist/index.js"]
