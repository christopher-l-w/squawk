# Production image for the Squawk API (Hono + Node).
# Build from repo root: docker build -t squawk-api .
# Run with DATABASE_URL, WEB_ORIGIN, NODE_ENV=production, PORT (optional).

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --ignore-scripts

COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/
COPY apps/api/src apps/api/src

RUN npm run build -w api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/api/dist/index.js"]
