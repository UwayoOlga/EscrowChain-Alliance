# ── Stage: Production Backend ──
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Ensure uploads directory exists
RUN mkdir -p uploads/properties

# Expose API port
EXPOSE 5000

# Start the server
CMD ["node", "server/index.js"]
