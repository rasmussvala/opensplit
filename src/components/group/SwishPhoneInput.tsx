interface SwishPhoneInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error: string | null
  helperText?: string
}

export default function SwishPhoneInput({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
}: SwishPhoneInputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="font-medium text-sm">
        {label}
      </label>
      <input
        id={id}
        type="tel"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="070 123 45 67"
        className="rounded border px-3 py-2 text-base md:text-sm"
        aria-invalid={error ? "true" : undefined}
      />
      {error && <span className="text-destructive text-xs">{error}</span>}
      {helperText && (
        <span className="text-muted-foreground text-xs">{helperText}</span>
      )}
    </div>
  )
}
