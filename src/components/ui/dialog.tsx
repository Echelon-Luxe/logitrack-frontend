'use client';

import * as React from 'react';
import * as D from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({ title, description, children, className, side }: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  // 'right' renders as a slide-over sheet.
  side?: 'center' | 'right';
}) {
  const sheet = side === 'right';
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink-950/40-[2px] data-[state=open]:animate-[fade-up_0.2s_ease-out]" />
      <D.Content
        className={cn(
          'fixed z-50 flex flex-col border border-line bg-surface shadow-[var(--shadow-pop)] focus:outline-none',
          sheet
            ? 'inset-y-0 right-0 w-full max-w-lg data-[state=open]:animate-[fade-up_0.25s_ease-out]'
            : 'top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl data-[state=open]:animate-[fade-up_0.2s_ease-out]',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <D.Title className="text-base font-semibold tracking-tight">{title}</D.Title>
            {description ? <D.Description className="mt-0.5 text-[13px] text-muted">{description}</D.Description> : <D.Description className="sr-only">{title}</D.Description>}
          </div>
          <D.Close className="-mr-1 grid size-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-fg" aria-label="Close">
            <X className="size-4" />
          </D.Close>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-5">{children}</div>
      </D.Content>
    </D.Portal>
  );
}
