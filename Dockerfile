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

# Install build dependencies and rebuild native modules
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    npm install && \
    apt-get remove -y python3 make g++ && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV ENABLE_AUTH=true
ENV VECTOR_LITE_API_KEY=1234567890

EXPOSE 7123

CMD ["node", "dist/server.js"]