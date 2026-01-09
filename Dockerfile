# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Build arguments for environment variables
ARG DATABASE_URL="file:./data/data.db"
ARG ACCESS_USERNAME=""
ARG ACCESS_PASSWORD=""

# Set as environment variables
ENV DATABASE_URL=${DATABASE_URL}
ENV ACCESS_USERNAME=${ACCESS_USERNAME}
ENV ACCESS_PASSWORD=${ACCESS_PASSWORD}

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Run SvelteKit sync to generate .svelte-kit directory (required by Prisma)
RUN npx svelte-kit sync

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

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

# Generate Prisma client (migrations are applied at runtime via db:deploy)
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/build ./build

# Create directory for SQLite database
RUN mkdir -p /app/data

# Set environment variables
ENV NODE_ENV=production

# Expose port (default SvelteKit port)
EXPOSE 3000

# Start the application (push schema then start)
CMD ["sh", "-c", "npx prisma db push --skip-generate && node build/index.js"]
