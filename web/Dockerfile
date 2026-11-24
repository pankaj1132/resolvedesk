FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN chown node:node /app

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

USER node

COPY --chown=node:node package.json package-lock.json ./

RUN npm ci

COPY --chown=node:node . .

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate --config=prisma7.config.ts && npm run dev -- --hostname 0.0.0.0"]