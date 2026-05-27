import { PrismaClient } from "@prisma/client";

// Single Prisma client per Node process — prevents exhausting the
// Neon connection pool during hot-reload in development.

declare global {
  // eslint-disable-next-line no-var
  var __synapsePrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__synapsePrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__synapsePrisma = prisma;
}
