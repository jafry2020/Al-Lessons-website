import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Augment the default Session shape so `session.user.id` is typed.
   * Auth.js's PrismaAdapter exposes the user id at runtime; this just makes
   * TypeScript aware of it.
   */
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
