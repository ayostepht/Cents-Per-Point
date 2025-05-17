FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN mkdir -p ./data
EXPOSE 5000
CMD ["npm", "start"] 