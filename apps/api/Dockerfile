FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile --filter @chippin/api... && pnpm --filter @chippin/shared build && DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm db:generate && pnpm --filter @chippin/api build
ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "pnpm db:deploy && node apps/api/dist/main.js"]
