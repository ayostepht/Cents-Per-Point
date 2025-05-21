FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS prod
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build ./build
COPY start.sh ./
RUN chmod +x start.sh
EXPOSE 3000
CMD ["./start.sh"] 