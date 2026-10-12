'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { can, homeFor, type Capability } from '@/lib/rbac';
import { Button } from '@/components/ui/button';

/**
 * Page-level guard. Presentation only - it spares people a page full of 403s.
 * The services enforce the same rules on every request regardless.
 */
export function RequireCapability({ cap, children }: { cap: Capability; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return null;
  if (can(user.role, cap)) return <>{children}</>;
  return (
    <div className="mx-auto mt-16 flex max-w-md flex-col items-center gap-4 text-center">
      <span className="grid size-14 place-items-center rounded-xl bg-rose-500/10 text-rose-600">
        <ShieldAlert className="size-6" />
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">You don&apos;t have access to this page</h1>
        <p className="mt-1.5 text-sm text-muted">
          Your role doesn&apos;t include this area. If you think that&apos;s wrong, ask an administrator to update your role.
        </p>
      </div>
      <Button asChild variant="secondary"><Link href={homeFor(user.role)}>Back to safety</Link></Button>
    </div>
  );
}
