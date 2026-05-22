FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
# Install deps: prefer npm ci when package-lock.json exists, fall back to npm install
RUN if [ -f package-lock.json ]; then \
			npm ci --unsafe-perm --no-audit --no-fund; \
		else \
			npm install --unsafe-perm --no-audit --no-fund; \
		fi

# Allow build-time override of API base URL
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
