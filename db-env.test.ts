/// <reference types="bun" />
import { expect, test } from "bun:test";

test("maps DATABASE_URL to PG* variables", async () => {
	process.env.DATABASE_URL = "postgres://app:p%40ss%3Aword@db.example.com:6543/site?sslmode=require";
	await import("./db-env.mjs");
	expect(process.env.PGHOST).toBe("db.example.com");
	expect(process.env.PGPORT).toBe("6543");
	expect(process.env.PGUSER).toBe("app");
	expect(process.env.PGPASSWORD).toBe("p@ss:word");
	expect(process.env.PGDATABASE).toBe("site");
	expect(process.env.PGSSLMODE).toBe("require");
});

test("libpq-compatible URL encrypts without verifying the certificate", async () => {
	process.env.DATABASE_URL = "postgres://app:pw@db.internal:5432/site?sslmode=require&uselibpqcompat=true";
	const freshModule = "./db-env.mjs?libpq"; // query string forces a re-run of the module
	await import(freshModule);
	expect(process.env.PGSSLMODE).toBe("no-verify");
});
