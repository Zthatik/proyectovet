# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM node:22-slim AS runner

WORKDIR /app

# Copiar artefactos del builder (no reinstalar — evita conflictos de binarios)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist        ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/src/db      ./src/db
COPY --from=builder /app/start.sh    ./start.sh

RUN chmod +x ./start.sh

ENV HOST=0.0.0.0
ENV PORT=4321
ENV NODE_ENV=production

EXPOSE 4321

CMD ["./start.sh"]
