import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import AddToHomeScreen from "./AddToHomeScreen"

describe("AddToHomeScreen", () => {
  it("shows the iOS steps by default", () => {
    render(<AddToHomeScreen onContinueInBrowser={vi.fn()} />)

    expect(screen.getByText(/install opensplit/i)).toBeInTheDocument()
    expect(screen.getByText(/tap the share button/i)).toBeInTheDocument()
  })

  it("switches to the Android steps", () => {
    render(<AddToHomeScreen onContinueInBrowser={vi.fn()} />)

    fireEvent.click(screen.getByRole("tab", { name: /android/i }))

    expect(screen.getByText("Open the menu")).toBeInTheDocument()
    expect(screen.getByText("Install app")).toBeInTheDocument()
  })

  it("calls onContinueInBrowser when the escape link is clicked", () => {
    const onContinue = vi.fn()
    render(<AddToHomeScreen onContinueInBrowser={onContinue} />)

    fireEvent.click(
      screen.getByRole("button", { name: /continue in browser/i }),
    )

    expect(onContinue).toHaveBeenCalledOnce()
  })
})
