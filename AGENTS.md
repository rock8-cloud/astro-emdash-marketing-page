# AGENTS.md

Instructions for coding agents working in this repository. Read
[README.md](README.md) for what the blueprint _is_; this file is the short list
of things that will break if you ignore them.

## What this is

A single-app **EmDash CMS** blueprint: an [Astro](https://astro.build) site with
EmDash's admin UI at `/_emdash/admin`, server-rendered on Bun, storing content
in **PostgreSQL** and media on local disk or S3. It builds to a standalone
`@astrojs/node` server and deploys to [Rock8Cloud](https://rock8.cloud) from the
checked-in `Dockerfile`. The landing page is for **Acme**, a fictional product —
placeholder content, safe to replace (in the admin, not in code).

Package manager and runtime is **bun** (commit `bun.lock`; never add
`package-lock.json`, `pnpm-lock.yaml` or `yarn.lock`).

## Layout

| Path                          | What lives there                                                                 |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `astro.config.mjs`            | Astro + `emdash()` integration: database, storage, fonts, icons                  |
| `db-env.mjs`                  | Loads `.env`; maps `DATABASE_URL` → `PG*` vars at runtime (preloaded by `start`) |
| `src/storage.mjs`             | Media storage chosen at runtime: S3 when `S3_BUCKET` is set, else `./uploads`    |
| `seed/seed.json`              | Schema + demo content (collections, block types, menus), applied at setup        |
| `src/pages/`                  | Astro pages — all server-rendered                                                |
| `src/components/blocks/`      | One Astro component per marketing block type                                     |
| `src/components/MarketingBlocks.astro` | Maps stored blocks to components via `defineBlockComponents()`          |
| `src/layouts/Base.astro`      | Base layout with EmDash wiring (menus, search, page contributions)               |
| `src/styles/theme.css`        | Design-token overrides (restyle here; never edit `tokens.css`)                   |
| `src/live.config.ts`          | EmDash loader registration (boilerplate — don't modify)                          |
| `emdash-env.d.ts`             | Generated collection types (regenerated on dev server start)                     |
| `.agents/skills/`             | EmDash agent skills (`.claude/skills` links here)                                |
| `Dockerfile`                  | How Rock8Cloud builds this service                                               |
| `docker-compose.yml`          | Local Postgres (`app` profile adds the production image)                         |

## Skills and docs

Load the skills in `.agents/skills/` for EmDash work:

- **building-emdash-site** — querying content, rendering Portable Text, schema design, seed files, site features (menus, widgets, search, SEO). Start here.
- **creating-plugins** — EmDash plugins: hooks, storage, admin UI, API routes, block types.
- **emdash-cli** — CLI for content, schema, seeding, type generation.

`.mcp.json` connects two MCP servers: **emdash-docs** (`https://docs.emdashcms.com/mcp`)
— call `search_docs` to verify an API, field type or config option instead of
relying on recall — and **rock8cloud** for agent-driven deploys.

## Rules

- **Never pass env values into `postgres()`, `s3()` or other `emdash()` config.**
  EmDash serializes that config into `dist/` at build time, so
  `postgres({ connectionString: process.env.DATABASE_URL })` bakes the
  build-time password into the image and ignores the runtime value. Keep
  `postgres({})` and let `db-env.mjs` map `DATABASE_URL`; keep storage on
  `src/storage.mjs`, which reads `S3_*` at runtime. The Docker image is built
  without secrets.
- **Don't re-enable presigned S3 uploads** in `src/storage.mjs`. The admin's CSP
  (`connect-src 'self'`) blocks browser PUTs to the bucket, so uploads must go
  through the app (`/_emdash/api/media/:id/upload`), which also avoids bucket CORS.
- **Honor `S3_FORCE_PATH_STYLE`.** EmDash's S3 adapter hardcodes path-style
  requests; Rock8Cloud's public storage endpoint 404s on them, so
  `src/storage.mjs` swaps in a virtual-host client when the variable is `false`.
- **Start production through `db-env.mjs`.** `bun run start` and the Dockerfile
  run `bun --preload ./db-env.mjs ./dist/server/entry.mjs`; without the preload
  the server has no database connection.
- **Content structure changes go through the schema.** A new field or block
  type means editing `seed/seed.json` (for fresh installs) _and_ the running
  site's schema (admin or `bunx emdash schema`), then the component. A
  component that reads a field the schema doesn't define renders `undefined`.
- **Add every new environment variable** to `.env.example` and the README.
- **Don't hardcode the port.** `PORT` is injected by Rock8Cloud and read by the
  Astro Node server; the `EXPOSE`d port (4321) must match the service port.
- **Keep the Dockerfile in step with the build.** If you add files the server
  needs at runtime (like `db-env.mjs`), copy them in the runtime stage and
  check `.dockerignore`.
- All content pages must be server-rendered (`output: "server"`). No `getStaticPaths()` for CMS content.
- Image fields are objects (`{ src, alt }`), not strings. Use `<Image image={...} />` from `"emdash/ui"`.
- `entry.id` is the slug (for URLs). `entry.data.id` is the database ULID (for API calls like `getEntryTerms`).
- When Astro's cache is enabled, pass content-query hints to `Astro.cache.set(cacheHint)`. Use the `WithCacheHint` variants for site settings, menus, taxonomies, and widget areas rendered by cached routes.
- Taxonomy names in queries must match the seed's `"name"` field exactly (e.g., `"category"` not `"categories"`).

## This Template

A SaaS-style landing page template with modular content blocks: hero, features, testimonials, pricing, FAQ, plus a contact page with direct email calls to action. Designed for product marketing sites, app landing pages, and anything that needs a hero + features + pricing + CTA flow.

Bolder than the blog and portfolio templates: vibrant gradient accents, isometric illustration in the hero, heavy headline weights. The voice is product-confident without tipping into stock SaaS cliche.

## Pages

| Page    | Path       | What it shows                                                                                                       |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------- |
| Home    | `/`        | Marketing blocks in any order (hero, features, testimonials, pricing, FAQ) authored in the Home page's blocks field |
| Pricing | `/pricing` | The same block editor, with a hero, pricing comparison, and FAQ                                                     |
| Contact | `/contact` | CMS-authored hero followed by direct email contacts for general questions, support, and sales                       |

There is no posts collection. Content is entirely authored as marketing blocks inside `pages`.

## Schema

- `pages` collection: `title`, `content` (a first-class `blocks` field).
- No taxonomies.
- Four menus: `primary`, `footer_product`, `footer_company`, `footer_support`.

Site settings have `title` and `tagline`. Title renders in the header; tagline is used in the footer / metadata.

## Marketing blocks

The seed declares five versioned block types. Editors add, reorder, duplicate, and edit them with the built-in blocks field editor. `MarketingBlocks.astro` maps the generated `PageContentBlock` union to `src/components/blocks/{Hero,Features,Testimonials,Pricing,FAQ}.astro` with `defineBlockComponents()`.

| Block                    | Fields                                                                                                                 |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `marketing_hero`         | `anchor_id`, `headline`, `subheadline`, flattened primary and secondary CTA label/URL pairs, `image`, `centered`       |
| `marketing_features`     | `anchor_id`, `headline`, `subheadline`, repeater of `{ icon, title, description }`                                     |
| `marketing_testimonials` | `anchor_id`, `headline`, repeater of `{ quote, author, role, company, avatar }` where `avatar` is an image field       |
| `marketing_pricing`      | `anchor_id`, `headline`, repeater of `{ name, price, period, description, features, cta_label, cta_url, highlighted }` |
| `marketing_faq`          | `anchor_id`, `headline`, repeater of `{ question, answer }`                                                            |

Constraints worth remembering:

- Block fields cannot contain nested object groups, so CTA labels and URLs remain sibling fields.
- Repeaters cannot contain nested repeaters. Pricing features therefore remain one multiline text value, split on newline by the renderer.
- Hero and testimonial media are EmDash image fields. Render them with `<Image>` from `emdash/ui`, not a raw URL.
- The Hero block falls back to `/hero-visual.svg` when its image field is empty.
- Every stored block has immutable `_type`, `_version`, and `_key` values. Components receive the generated value as `value` plus `index` and `blockKey`; do not treat blocks as Portable Text nodes.
- Render stored CTA URLs through `sanitizeHref()` even when their field validation rejects unsafe-looking values.
- Icons in the Features block come from a fixed set: `zap, shield, users, chart, code, globe, heart, star, check, lock, clock, cloud`. Pick from that list.

## Visual character

Typography is **Inter** on `--font-body` with weights up to 800 for headline emphasis (`--font-weight-display: 800` on hero and section headlines, `--font-weight-heading: 700` on other headings). There is no mono font, no serif. Headline tracking is tight (`--tracking-tight`).

Colour is the loudest of any template here. The default palette is:

- `--color-brand: #6366f1` (indigo) -- main brand colour, used in buttons and links, with `--color-brand-strong` / `--color-brand-soft` shades
- `--color-accent: #f472b6` (pink) -- the gradient partner to brand
- `--color-success`, `--color-warning`, `--color-danger` -- semantic colours (pricing checkmarks and status accents)

Gradients are part of the look and are tokens themselves: `--gradient-brand` (logo, icon tiles, pricing badge, CTA hover), `--gradient-brand-strong` (CTA resting state), `--gradient-brand-soft` (hero image glow), and `--gradient-headline` (hero headline text fill). They follow the brand/accent colours automatically, so a rebrand usually only needs new `--color-brand-*` / `--color-accent-*` values. Don't strip the gradients entirely -- the template will look generic without them -- but a flat brand can set the `--gradient-*` tokens to solid colours.

Shared utility classes keep the blocks consistent: `.section-header` / `.section-headline` / `.section-subheadline` for centred block intros, and `.icon-tile` for the 48px gradient icon squares. Use them in new blocks rather than restyling per block.

Roundness is generous: `--radius` is 10px, `--radius-lg` 16px, plus a `--radius-full` for pills. Shadows are layered (`--shadow-sm` through `--shadow-xl`).

## Customisation

Design tokens live in `src/styles/tokens.css` with their default values. To restyle the site, override tokens in `src/styles/theme.css` -- declarations there are unlayered, so they always beat the `@layer base` defaults. Don't edit `tokens.css` or `Base.astro` for visual changes.

Colours are defined with `light-dark(<light>, <dark>)`, so each token carries both modes. Overriding with a plain colour changes light and dark at once; use `light-dark()` in the override to keep them distinct. There is no separate dark palette to maintain.

Webfonts are configured in `astro.config.mjs` under `fonts:`. To swap the typeface, change the `name:` for the entry bound to `cssVariable: "--font-body"`. Inter has 5 weights loaded (400-800) for hero impact -- if you swap, ensure the replacement has comparable weight range. Geist, Plus Jakarta Sans, Manrope, and DM Sans all work well as replacements. For a system font, or a separate heading face, override `--font-body` / `--font-heading` in `theme.css`. A softer voice (editorial, luxury) usually also wants `--font-weight-display: 700` or lower.

CSS variables worth knowing (see `tokens.css` for the full list):

- `--color-brand`, `--color-brand-strong`, `--color-brand-soft`, `--color-on-brand`, `--color-brand-ring`
- `--color-accent`, `--color-accent-soft`
- `--gradient-brand`, `--gradient-brand-strong`, `--gradient-brand-soft`, `--gradient-headline`
- `--color-bg`, `--color-surface`, `--color-text`, `--color-muted`, `--color-border`
- `--color-success`, `--color-warning`, `--color-danger`
- `--font-body`, `--font-heading`, `--font-weight-heading` (700), `--font-weight-display` (800)
- `--font-size-{xs,sm,base,lg,xl,2xl,3xl,4xl,5xl,6xl}` -- type scale up to 4.5rem for the largest hero
- `--radius-sm` (6px), `--radius` (10px), `--radius-lg` (16px), `--radius-full`
- `--shadow-sm`, `--shadow`, `--shadow-lg`, `--shadow-xl`

To re-brand, the highest-leverage moves are:

1. Change `--color-brand` (and its `-strong` / `-soft` shades) and `--color-accent` to the brand pair -- the gradients follow.
2. Update the site title (logo wordmark) and tagline.
3. Choose a Hero image in the media library or replace the fallback illustration.
4. Edit hero `headline` and `subheadline` blocks to specific, concrete copy.

## What not to do

- Don't write stock SaaS copy: "Build products people actually want", "Elevate your workflow", "The all-in-one platform for modern teams". These are placeholder. Write what the product actually does, for whom, with one specific outcome.
- Don't ship more than three pricing tiers. Three is the default for a reason -- more makes choice harder, not easier.
- Don't use icon and stock photo combos that fight each other. Pick illustration _or_ photography, not both.
- Don't enable the gradient on every interactive element. The CTA gradient is the signal; if it's on every button, it stops signalling.
- Don't add a hero block followed immediately by another hero block. One hero, then features / testimonials / pricing / FAQ in some order.
- Don't replace the `marketing_pricing` block with a hand-coded table. The block is the data shape downstream renderers expect.

## Commands

| Command                   | Notes                                                       |
| ------------------------- | ----------------------------------------------------------- |
| `bun install`             | Commit `bun.lock`                                           |
| `docker compose up -d`    | Local Postgres — required before `dev`                      |
| `bun run dev`             | Dev server on `:4321`, admin at `/_emdash/admin`            |
| `bun run build`           | Production build → `dist/`                                  |
| `bun run start`           | Run the build with `db-env.mjs` preloaded                   |
| `bun run typecheck`       | `astro check` — run before you call a change done           |
| `bun test`                | Unit tests (`db-env.test.ts`)                               |
| `bunx emdash types`       | Regenerate `emdash-env.d.ts` from the running site          |

Verify changes with `typecheck`, `test`, `build`, and by loading the page and
the admin.

## Deployment

Rock8Cloud builds the root `Dockerfile`: `oven/bun` installs with
`--frozen-lockfile` and runs `bun run build`, then the slim Bun image runs
`dist/server/entry.mjs` on port 4321 as a non-root user. It needs a managed
PostgreSQL (its connection URL linked to `DATABASE_URL`), `EMDASH_ENCRYPTION_KEY`
and `EMDASH_SITE_URL`, plus S3 object storage for media — the container disk is
not persistent. Migrations run automatically on startup. Login sessions use
Astro's filesystem session store, so run a single instance (or configure a
shared session driver) before scaling out. `.mcp.json` wires up the Rock8Cloud
MCP server (OAuth), so "Deploy this project to Rock8Cloud" works from an
MCP-capable agent.
