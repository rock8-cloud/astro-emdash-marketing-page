/// <reference types="bun" />
import { expect, test } from "bun:test";

test("S3 storage refuses signed uploads so the admin uploads through the app", async () => {
	process.env.S3_BUCKET = "media";
	process.env.S3_ENDPOINT = "https://s3.example.com";
	process.env.S3_ACCESS_KEY = "key";
	process.env.S3_SECRET_KEY = "secret";
	const storageModule = "./storage.mjs"; // untyped .mjs, imported by path like db-env.test.ts
	const { createStorage } = await import(storageModule);
	const storage = createStorage({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" });
	await expect(storage.getSignedUploadUrl({ key: "a.png", contentType: "image/png", size: 1 })).rejects.toMatchObject({
		code: "NOT_SUPPORTED",
	});
});

test("S3_FORCE_PATH_STYLE=false switches to virtual-host requests", async () => {
	process.env.S3_FORCE_PATH_STYLE = "false";
	const storageModule = "./storage.mjs?vhost"; // query string forces a fresh module
	const { createStorage } = await import(storageModule);
	const storage = createStorage({ directory: "./uploads", baseUrl: "/_emdash/api/media/file" });
	expect(storage.client.config.forcePathStyle).toBe(false);
	delete process.env.S3_FORCE_PATH_STYLE;
});
