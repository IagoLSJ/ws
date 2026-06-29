FROM node:20-alpine AS base
RUN npm i -g pnpm@latest
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter=@multinegocio/api prisma:generate && pnpm --filter=@multinegocio/api build

FROM base AS runner
WORKDIR /app/backend
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma ./prisma
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/package.json ./
EXPOSE 3000
CMD ["node", "dist/src/main"]
