// EmDash serializes its database config into the build output, so DATABASE_URL is mapped
// to the PG* variables pg reads at runtime instead of being baked into dist/.
// Loaded by astro.config.mjs (dev/build) and preloaded by `bun start` (production).
try {
	process.loadEnvFile(); // .env is optional: Docker and hosted deploys pass real env vars
} catch {}

if (process.env.DATABASE_URL) {
	const url = new URL(process.env.DATABASE_URL);
	process.env.PGHOST = url.hostname;
	process.env.PGPORT = url.port || "5432";
	process.env.PGUSER = decodeURIComponent(url.username);
	process.env.PGPASSWORD = decodeURIComponent(url.password);
	process.env.PGDATABASE = decodeURIComponent(url.pathname.slice(1));
	const sslmode = url.searchParams.get("sslmode");
	// uselibpqcompat=true (Rock8Cloud's managed URL): require/prefer encrypt without verifying, as in libpq.
	const libpq = url.searchParams.get("uselibpqcompat") === "true";
	if (sslmode) process.env.PGSSLMODE = libpq && ["require", "prefer"].includes(sslmode) ? "no-verify" : sslmode;
}
