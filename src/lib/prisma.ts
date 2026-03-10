import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const rawUrl = process.env.DATABASE_URL ?? "";
let prismaUrl = rawUrl;

if (rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.host.includes("pooler.supabase.com")) {
      url.searchParams.set("pgbouncer", "true");
      url.searchParams.set("statement_cache_size", "0");
    }
    prismaUrl = url.toString();
  } catch {
    prismaUrl = rawUrl;
  }
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["error", "warn"],
    datasources: prismaUrl ? { db: { url: prismaUrl } } : undefined,
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
