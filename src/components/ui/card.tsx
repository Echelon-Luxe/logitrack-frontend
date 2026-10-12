import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-[var(--radius-card)] border border-line bg-surface shadow-[var(--shadow-card)]', className)}
    {...props}
  />
);

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-start justify-between gap-3 p-5 pb-3', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-[15px] font-semibold tracking-tight', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('mt-0.5 text-[13px] text-muted', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5 pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center gap-2 border-t border-line px-5 py-3.5', className)} {...props} />
);
