FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 sveltekit

# Copy necessary files
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Create data directory for SQLite database
RUN mkdir -p /app/data && chown -R sveltekit:nodejs /app/data

USER sveltekit

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL="file:/app/data/data.db"

# Run migrations and start the application
CMD npx prisma migrate deploy && node build/index.js
