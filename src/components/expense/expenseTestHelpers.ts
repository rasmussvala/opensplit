import { vi } from "vitest"

const defaultGroup = {
  id: "group-1",
  name: "Trip to Oslo",
  currency: "USD",
  invite_token: "token-abc",
}

export function groupsOk(group: unknown = defaultGroup) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({ data: group, error: null }),
      }),
    }),
  }
}

export function groupsMissing() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "not found" },
        }),
      }),
    }),
  }
}
