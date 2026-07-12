import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// Maps every domain status to a consistent soft colour matching the new theme
const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: 'bg-[#E5F5EF] text-[#1B5E47]',
  ON_TRIP: 'bg-black text-white',
  DISPATCHED: 'bg-black text-white',
  IN_SHOP: 'bg-orange-100 text-orange-800',
  RETIRED: 'bg-red-100 text-red-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  OFF_DUTY: 'bg-gray-100 text-gray-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-[#E5F5EF] text-[#1B5E47]',
  CANCELLED: 'bg-red-100 text-red-800',
};

const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-3 py-1 text-[10px] uppercase font-semibold tracking-wider',
        STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800',
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
      className={cn('inline-flex items-center rounded-lg bg-gray-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider', className)}
      {...props}
    />
  );
}
