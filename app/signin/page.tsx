import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { Github } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;
  if (session?.user) {
    redirect(callbackUrl ?? "/dashboard");
  }

  async function signInWithGitHub() {
    "use server";
    await signIn("github", { redirectTo: callbackUrl ?? "/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-md flex-col justify-center px-6 py-12">
      <div className="rounded-lg border border-border-subtle bg-surface p-8 shadow-sm">
        <h1 className="text-h2 tracking-tight">Sign in to Synapse</h1>
        <p className="mt-2 text-body text-text-secondary">
          Track your progress, earn certificates, pick up where you left off.
        </p>

        <form action={signInWithGitHub} className="mt-8">
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-text-primary px-5 text-body font-medium text-canvas transition-colors hover:opacity-90"
          >
            <Github size={18} />
            Continue with GitHub
          </button>
        </form>

        <p className="mt-6 text-caption text-text-muted">
          By signing in, you agree to our terms. We only read your public profile and email —
          nothing else.
        </p>
      </div>
    </div>
  );
}
