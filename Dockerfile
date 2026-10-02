# ============================================================
# ESWA Wellbeing Hub — all-in-one production image
# Build:  docker build -t eswa-wellbeing-hub .
# Run:    docker run -p 3000:3000 --env-file .env eswa-wellbeing-hub
# ============================================================

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Non-root user for security
RUN addgroup -S eswa && adduser -S eswa -G eswa
COPY --from=build --chown=eswa:eswa /app/.output ./.output
USER eswa
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["node", ".output/server/index.mjs"]
