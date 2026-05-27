import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Server-side helper for any route under /dashboard or any API route that
 * requires a signed-in user. Returns the session.user on success, redirects
 * to /signin?callbackUrl=<current> otherwise.
 */
export async function requireAuth(callbackUrl: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session.user;
}
