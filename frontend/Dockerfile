# Build stage
FROM node:22-alpine AS build
WORKDIR /workspace
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage (Production Nginx)
FROM nginx:stable-alpine
COPY --from=build /workspace/dist /usr/share/nginx/html

# Inline Nginx configuration to support SPA routing (React Router)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
