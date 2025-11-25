
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++ 

COPY package*.json ./
RUN npm ci --silent

COPY tsconfig*.json ./
COPY src ./src
# build
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/main.js"]
