# Backend multistage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
# Install ALL deps (including devDeps for tsc)
RUN if [ -f package-lock.json ]; then \
			npm ci --unsafe-perm --no-audit --no-fund; \
		else \
			npm install --unsafe-perm --no-audit --no-fund; \
		fi

COPY . .
RUN npm run build

# Separate stage: production-only node_modules
FROM node:20-alpine AS prod-deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
			npm ci --omit=dev --no-audit --no-fund; \
		else \
			npm install --omit=dev --no-audit --no-fund; \
		fi

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --from=builder   /usr/src/app/dist          ./dist
COPY --from=builder   /usr/src/app/package.json  ./package.json

EXPOSE 3000
CMD ["node", "dist/index.js"]

