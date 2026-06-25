// Prisma 7 configuration. Connection URLs moved here from the schema.
// Load secrets from .env.local (Next.js convention; gitignored).
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  // The Prisma CLI (migrate / db push) uses this — the DIRECT connection (5432).
  datasource: {
    url: env("DIRECT_URL"),
  },
});
