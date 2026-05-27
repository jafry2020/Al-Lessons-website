import type { Metadata } from "next";
import { Award } from "lucide-react";
import { requireAuth } from "@/lib/require-auth";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Certificates" };

export default async function CertificatesPage() {
  const user = await requireAuth("/dashboard/certificates");
  const certs = await prisma.certificate.findMany({
    where: { userId: user.id },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10">
      <header className="mb-10">
        <div className="text-overline uppercase text-text-muted">Certificates</div>
        <h1 className="mt-1 text-h1 tracking-tight">Certificates</h1>
        <p className="mt-2 text-body text-text-secondary">
          Complete a track to earn a shareable certificate.
        </p>
      </header>

      {certs.length === 0 ? (
        <div className="grid place-items-center rounded-lg border border-dashed border-border-subtle bg-surface px-6 py-16 text-center">
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-subtle text-text-muted">
            <Award size={24} />
          </div>
          <h3 className="text-h3">No certificates yet</h3>
          <p className="mt-2 max-w-md text-body text-text-secondary">
            When you finish a track, a certificate appears here automatically and you&apos;ll get a
            shareable link.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {certs.map((c) => (
            <li key={c.id} className="rounded-md border border-border-subtle bg-surface p-6">
              <div className="text-overline uppercase text-accent-700">{c.track}</div>
              <div className="mt-2 text-h4">Track completed</div>
              <div className="mt-1 text-caption text-text-muted">
                Issued {c.issuedAt.toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
