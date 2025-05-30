FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app
COPY package*.json ./
# Install all dependencies including optional ones for migration
RUN npm ci --include=optional
COPY src/ ./src/
ENV NODE_ENV=production
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1
CMD ["npm", "start"] 