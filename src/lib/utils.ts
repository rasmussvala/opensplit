import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatAmountNumber(amount: number): string {
  return new Intl.NumberFormat("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  })
    .format(Number(amount))
    .replace(/,/g, "\u2009") // thin space as thousand separator
}

export function formatAmount(currency: string, amount: number): string {
  return `${currency} ${formatAmountNumber(amount)}`
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function useAppVersion() {
  return import.meta.env.VITE_APP_VERSION ?? "dev"
}
