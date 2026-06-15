# ── Stage 1: Build the React/Vite app ──
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass the Blockfrost API key at build time
ARG VITE_BLOCKFROST_PROJECT_ID
ENV VITE_BLOCKFROST_PROJECT_ID=$VITE_BLOCKFROST_PROJECT_ID

RUN npm run build

# ── Stage 2: Serve with Nginx ──
FROM nginx:alpine

# Remove default Nginx config and replace with ours
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built static files from Stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
