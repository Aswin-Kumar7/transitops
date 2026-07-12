import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Maps every domain status to a consistent colour (matches the wireframe badges).
const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-status-available text-white',
  ON_TRIP: 'bg-status-ontrip text-white',
  DISPATCHED: 'bg-status-ontrip text-white',
  IN_SHOP: 'bg-status-inshop text-white',
  RETIRED: 'bg-status-retired text-white',
  SUSPENDED: 'bg-status-retired text-white',
  OFF_DUTY: 'bg-status-draft text-white',
  DRAFT: 'bg-status-draft text-white',
  COMPLETED: 'bg-status-available text-white',
  CANCELLED: 'bg-status-retired text-white',
};

const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold',
        STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {humanize(status)}
    </span>
  );
}

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold', className)}
      {...props}
    />
  );
}
