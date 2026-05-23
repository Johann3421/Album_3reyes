# Backend multistage Dockerfile
FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then \
			npm ci --no-audit --no-fund; \
		else \
			npm install --no-audit --no-fund; \
		fi

COPY . .
RUN npm run build

# Runner: copy pre-built artifacts — no npm install needed at runtime
FROM node:20-alpine AS runner
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist         ./dist
COPY --from=builder /usr/src/app/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/index.js"]

