# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache curl

# Install pnpm (force cache bust)
RUN npm install -g pnpm@8.15.4 && echo "Cache bust: $(date)"

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/embed-sdk/package.json ./packages/embed-sdk/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (skip frozen lockfile for Railway compatibility)
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm run build:railway

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the server
CMD ["pnpm", "run", "start:railway"]
