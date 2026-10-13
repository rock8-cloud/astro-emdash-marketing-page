# CLAUDE.md

**All project guidance lives in [AGENTS.md](AGENTS.md). Read it before making
changes.** It is the single source of truth — keep it updated rather than
duplicating content here.

Quick orientation:

- Single Astro app with the EmDash CMS (admin at `/_emdash/admin`), bun as
  package manager and runtime, PostgreSQL for content, built to `dist/` by
  `@astrojs/node`.
- `docker compose up -d` (Postgres), then `bun run dev` on `:4321`. Copy
  `.env.example` to `.env` first.
- Verify with `bun run typecheck`, `bun test` and `bun run build`, then load the
  page and the admin.
- Never put `process.env` values into the `emdash()` config — it is baked into
  the build. `DATABASE_URL` goes through `db-env.mjs`, `S3_*` through
  `src/storage.mjs`.
- Deploys to [Rock8Cloud](https://rock8.cloud) from the root `Dockerfile`;
  `.mcp.json` connects the Rock8Cloud MCP server for agent-driven deploys.
