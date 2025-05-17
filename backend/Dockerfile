FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p ./data
ENV NODE_ENV=production
EXPOSE 5000
CMD ["npm", "start"] 