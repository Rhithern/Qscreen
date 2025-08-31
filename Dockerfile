# Use Node.js 20 Alpine for smaller image size
FROM node:20-alpine

# Force cache invalidation with build arg
ARG CACHEBUST=1

# Install system dependencies and pnpm in one layer
RUN apk add --no-cache curl && \
    npm install -g pnpm@8.15.4 && \
    echo "Build timestamp: $(date)" && \
    echo "Cache bust: $CACHEBUST"

# Set working directory
WORKDIR /app

# Copy all files at once to break cache
COPY . .

# Install dependencies without frozen lockfile
RUN pnpm install --no-frozen-lockfile

# Build the application
RUN pnpm run build:railway

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Start the server
CMD ["pnpm", "run", "start:railway"]
