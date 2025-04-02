FROM node:20 as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-slim
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/config ./config

# Install build dependencies and rebuild native modules
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    npm install && \
    apt-get remove -y python3 make g++ && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV ENABLE_AUTH=true
ENV CONFIG_PATH=/app/config/config.json

EXPOSE 3000

CMD ["node", "dist/server.js"]