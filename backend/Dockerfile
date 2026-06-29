FROM node:20-alpine

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma:generate && pnpm build

EXPOSE 3000

CMD ["node", "dist/main"]
