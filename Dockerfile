# syntax=docker/dockerfile:1

# ─── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
# ci install is reproducible and skips postinstall scripts (safe for build deps)
RUN npm ci


# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the Linux target inside this container
RUN npx prisma generate

# Build-time env vars (not secrets — only public/build-time values needed here)
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build


# ─── Stage 3: Production runner ───────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user — Cloud Run best practice
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output: only what's needed to run the server
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

# Cloud Run injects PORT at runtime (default 8080).
# Next.js standalone server.js reads process.env.PORT automatically.
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Healthcheck for local `docker run` testing
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
