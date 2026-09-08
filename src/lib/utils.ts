import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function useAppVersion() {
  return import.meta.env.VITE_APP_VERSION ?? "dev"
}
