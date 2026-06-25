import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Prisma client singleton.
 *
 * Prisma 7 is driver-adapter based: the runtime connection goes through
 * `@prisma/adapter-pg` using the POOLED connection (DATABASE_URL, pgBouncer
 * 6543). Migrations use the direct/session connection (DIRECT_URL) via
 * prisma.config.ts. In dev we cache on globalThis to avoid exhausting
 * connections on hot reload.
 */
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
