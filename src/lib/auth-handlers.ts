// Re-export the route handlers separately from the rest of the auth module.
// Keeps `src/lib/auth.ts` importable from server components (which would
// otherwise pull in the route-handler types where they aren't supported).
import { handlers } from "./auth";

export const { GET, POST } = handlers;
