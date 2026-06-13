# Multi-stage build for the API/WS server.
FROM node:24-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/server/package.json ./apps/server/package.json
RUN pnpm install --frozen-lockfile

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/
COPY pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/server ./apps/server
WORKDIR /app/apps/server
EXPOSE 8000
CMD ["pnpm", "start"]
