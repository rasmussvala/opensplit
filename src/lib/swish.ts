export const SWISH_CURRENCY = "SEK"
export const SWISH_PHONE_ERROR = "Enter a valid Swedish mobile number"

export function isSwishCurrency(currency: string): boolean {
  return currency === SWISH_CURRENCY
}

export interface SwishPaymentInput {
  phone: string
  amount: string
  message: string
}

export function normalizeSwishPhone(input: string): string | null {
  const cleaned = input.replace(/[\s\-()+]/g, "")
  if (cleaned === "" || !/^\d+$/.test(cleaned)) return null

  let normalized: string
  if (cleaned.startsWith("00")) {
    normalized = cleaned.slice(2)
  } else if (cleaned.startsWith("46")) {
    normalized = cleaned
  } else if (cleaned.startsWith("0")) {
    normalized = `46${cleaned.slice(1)}`
  } else {
    normalized = cleaned
  }

  if (!/^467\d{8}$/.test(normalized)) return null
  return normalized
}

export function buildSwishDeepLink({
  phone,
  amount,
  message,
}: SwishPaymentInput): string {
  return `swish://payment?phone=${phone}&amount=${amount}&message=${encodeURIComponent(message)}`
}

export function buildSwishQrPayload({
  phone,
  amount,
  message,
}: SwishPaymentInput): string {
  return `C${phone};${amount};${message};`
}

export function formatSwishAmount(amount: number): string {
  return amount.toFixed(2)
}

export function isMobileSwishDevice(): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches
  )
}
