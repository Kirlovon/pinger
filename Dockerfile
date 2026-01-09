# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Set build argument for database path
ARG DATABASE_PATH="./data/data.db"

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Set DATABASE_URL for Prisma client generation
ENV DATABASE_URL="file:${DATABASE_PATH}"

# Run SvelteKit sync to generate .svelte-kit directory (required by Prisma)
RUN npx svelte-kit sync

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

######################################################################

# Production stage
FROM node:22-alpine

WORKDIR /app

# Set DATABASE_URL for Prisma client generation
ENV DATABASE_URL="file:./data/data.db"

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy built application from builder
COPY --from=builder /app/build ./build

# Create directory for SQLite database
RUN mkdir -p /app/data

# Apply database migrations
RUN npx prisma migrate deploy

# Set environment variables
ENV NODE_ENV=production

# Expose port (default SvelteKit port)
EXPOSE 3000

# Apply migrations and start the application
CMD ["npm", "run", "start"]
