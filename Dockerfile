# ============================================================
# Cloud Run 用マルチステージ Dockerfile
# @react-pdf/renderer (Pure JS) + Next.js standalone
# ============================================================

FROM node:22-slim AS base

# ============================================================
FROM base AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ============================================================
FROM base AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.0 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm exec next build

# ============================================================
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# PDF生成用 日本語フォント（IPA ゴシック）
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-ipafont-gothic \
    && rm -rf /var/lib/apt/lists/*

# Next.js standalone モードの出力をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# PDF テンプレートとフォントをコピー
COPY --from=builder /app/pdf-templates ./pdf-templates

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 nextjs \
    && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
