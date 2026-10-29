# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time and are public by design.
ARG NEXT_PUBLIC_HYPERDX_API_KEY
ARG NEXT_PUBLIC_HYPERDX_URL=http://localhost:4318
ARG NEXT_PUBLIC_APP_PROJECT=hyperdx-nextjs-integration
ARG NEXT_PUBLIC_APP_ENV=local
ENV NEXT_PUBLIC_HYPERDX_API_KEY=$NEXT_PUBLIC_HYPERDX_API_KEY \
    NEXT_PUBLIC_HYPERDX_URL=$NEXT_PUBLIC_HYPERDX_URL \
    NEXT_PUBLIC_APP_PROJECT=$NEXT_PUBLIC_APP_PROJECT \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
RUN addgroup -S -g 1001 nodejs && adduser -S -u 1001 -G nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/trace/leaf').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Server runtime config (HYPERDX_API_KEY, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_SERVICE_NAME) comes from the environment.
CMD ["node", "server.js"]
