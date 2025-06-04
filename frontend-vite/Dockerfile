# Build stage
FROM node:18.18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV NODE_ENV=production

# If BACKEND_URL is set, export it as VITE_BACKEND_URL for Vite
ARG BACKEND_URL
ENV VITE_BACKEND_URL=$BACKEND_URL

RUN npm run build || (echo "Build failed" && exit 1)

# Production stage
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"] 