export function isMobileSwishDevice(): boolean {
  return (
    window.matchMedia("(pointer: coarse)").matches &&
    window.matchMedia("(hover: none)").matches
  )
}
