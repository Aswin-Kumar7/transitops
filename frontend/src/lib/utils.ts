import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, resolving conflicts. shadcn/ui convention. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as the depot currency (INR by default). */
export function formatCurrency(value: number | string, currency = 'INR') {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}
