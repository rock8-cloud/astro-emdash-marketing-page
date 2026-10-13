import node from "@astrojs/node";
import react from "@astrojs/react";
import icon from "astro-iconset";
import { fileURLToPath } from "node:url";
import { defineConfig, fontProviders } from "astro/config";
import emdash from "emdash/astro";
import { postgres } from "emdash/db";
import "./db-env.mjs";

export default defineConfig({
	output: "server",
	adapter: node({
		mode: "standalone",
	}),
	image: {
		layout: "constrained",
		responsiveStyles: true,
	},
	integrations: [
		react(),
		icon({
			// Only ship the Phosphor icons actually referenced in templates,
			// not the full @iconify-json/ph set.
			include: {
				ph: [
					"chart-bar",
					"check-circle",
					"clock",
					"cloud",
					"code",
					"currency-dollar",
					"envelope",
					"globe",
					"heart",
					"lifebuoy",
					"lightning",
					"lock",
					"shield-check",
					"sparkle",
					"star",
					"users-three",
				],
			},
		}),
		emdash({
			// Empty on purpose: the connection comes from DATABASE_URL at runtime (db-env.mjs).
			database: postgres({}),
			// Local ./uploads, or S3 when S3_BUCKET is set at runtime (src/storage.mjs).
			storage: {
				entrypoint: fileURLToPath(new URL("./src/storage.mjs", import.meta.url)),
				config: { directory: "./uploads", baseUrl: "/_emdash/api/media/file" },
			},
		}),
	],
	fonts: [
		{
			provider: fontProviders.google(),
			name: "Inter",
			cssVariable: "--font-body",
			weights: [400, 500, 600, 700, 800],
			fallbacks: ["sans-serif"],
		},
	],
	devToolbar: { enabled: false },
});
