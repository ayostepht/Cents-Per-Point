# Build stage
FROM node:18.18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ENV NODE_ENV=production
RUN npm run build || (echo "Build failed" && exit 1)

# Production stage
FROM nginx:alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
ENV PORT=5173
EXPOSE ${PORT}
CMD ["nginx", "-g", "daemon off;"] 