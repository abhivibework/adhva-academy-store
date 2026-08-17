import { spawnSync } from "node:child_process";
import path from "node:path";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  "";

process.env.DIRECT_DATABASE_URL =
  process.env.DIRECT_DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.DATABASE_URL;

if (!process.env.DATABASE_URL) {
  const found = Object.keys(process.env)
    .filter((key) => /POSTGRES|DATABASE|NEON|PRISMA/i.test(key))
    .sort()
    .join(", ");
  console.error(
    "Missing DATABASE_URL. In Vercel → Storage, add Postgres (Neon) and either leave the default POSTGRES_URL or set DATABASE_URL to that connection string.",
  );
  console.error(`Database-related env vars present: ${found || "none"}`);
  process.exit(1);
}

if (!process.env.DIRECT_DATABASE_URL) {
  process.env.DIRECT_DATABASE_URL = process.env.DATABASE_URL;
}

const bin = (name) =>
  path.join(process.cwd(), "node_modules", ".bin", name);

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(bin("prisma"), ["generate"]);
run(bin("prisma"), ["migrate", "deploy"]);
run(bin("prisma"), ["db", "seed"]);
run(bin("next"), ["build"]);
