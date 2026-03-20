# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/frontend/package.json ./apps/frontend/

RUN pnpm install --frozen-lockfile

COPY apps/backend/ ./apps/backend/
RUN pnpm --filter @scout/backend build

# Deploy to a clean directory with only production deps
RUN pnpm deploy --filter @scout/backend --prod --legacy /prod

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app

COPY --from=builder /prod ./
COPY --from=builder /app/apps/backend/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
