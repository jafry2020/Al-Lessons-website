import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  // Database sessions (not JWT) — lets us cascade-delete sessions when a user
  // is removed and lets the dashboard's progress queries assume the row exists.
  session: { strategy: "database" },
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async session({ session, user }) {
      // Expose the user id on the session — every API route needs it.
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
