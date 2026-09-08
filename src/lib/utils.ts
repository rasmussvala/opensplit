import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export { formatAmount, formatAmountNumber, round2 } from "@opensplit/core"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useAppVersion() {
  return import.meta.env.VITE_APP_VERSION ?? "dev"
}
