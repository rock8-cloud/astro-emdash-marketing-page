# Build from the repository root:
#   docker build -t emdash-blueprint .
#
# No build arguments: DATABASE_URL, S3_* and EMDASH_* are read from the
# environment when the container starts, so one image works in every environment.
FROM oven/bun:1.4.4 AS build
WORKDIR /app

COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile

COPY . .

# Astro + @astrojs/node emit a standalone server in dist/.
RUN bun run build

FROM oven/bun:1.4.4 AS deps
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.4.4-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Overridden by the platform; the Astro Node server reads PORT.
ENV PORT=4321

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json db-env.mjs ./

# uploads/: local media when S3_* is unset. node_modules/.astro/sessions: Astro's
# filesystem session store, which EmDash's login writes to.
RUN mkdir -p uploads node_modules/.astro/sessions \
	&& chown -R bun:bun uploads node_modules/.astro
USER bun

EXPOSE 4321
CMD ["bun", "--preload", "./db-env.mjs", "./dist/server/entry.mjs"]
