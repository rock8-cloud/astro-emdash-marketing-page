// EmDash bakes the storage adapter into the build, so the choice is made here at runtime:
// S3 when S3_BUCKET is set (Rock8Cloud object storage, reads the S3_* env vars), local disk otherwise.
import { S3Client } from "@aws-sdk/client-s3";
import { createStorage as createLocalStorage } from "emdash/storage/local";
import { createStorage as createS3Storage, resolveS3Config } from "emdash/storage/s3";

export function createStorage(localConfig) {
	if (!process.env.S3_BUCKET) return createLocalStorage(localConfig);
	// Rock8Cloud storage exports S3_ACCESS_KEY/S3_SECRET_KEY; EmDash's own S3_*_ID names win when set.
	const config = resolveS3Config({
		accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY,
		secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.S3_SECRET_KEY,
	});
	const storage = createS3Storage(config);
	if (process.env.S3_FORCE_PATH_STYLE === "false") {
		// EmDash hardcodes path-style requests; Rock8Cloud's public endpoint only routes <bucket>.<host> URLs.
		storage.client = new S3Client({
			endpoint: config.endpoint,
			region: config.region || "auto",
			forcePathStyle: false,
			...(config.accessKeyId && config.secretAccessKey
				? { credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey } }
				: {}),
		});
	}
	// The admin's CSP (connect-src 'self') blocks browser PUTs to presigned bucket URLs, so refuse
	// them: EmDash then falls back to uploading through /_emdash/api/media/:id/upload (no bucket CORS needed).
	storage.getSignedUploadUrl = async () => {
		throw Object.assign(new Error("Signed uploads disabled; upload through the API."), { code: "NOT_SUPPORTED" });
	};
	return storage;
}
