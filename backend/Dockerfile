FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose API port
EXPOSE 5000

# Start with PM2 via npx or directly with node
CMD ["npx", "pm2-runtime", "ecosystem.config.cjs"]
