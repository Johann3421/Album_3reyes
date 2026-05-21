FROM node:20-alpine AS builder
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install

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
