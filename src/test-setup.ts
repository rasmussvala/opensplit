import "@testing-library/jest-dom"
import { vi } from "vitest"

// jsdom doesn't implement matchMedia; provide a default no-match stub.
// Individual tests can override window.matchMedia as needed.
if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}
