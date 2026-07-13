// components/auth/SignUpModal.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { SignUpModal } from "./SignUpModal"

// jsdom has no ResizeObserver. Radix's Checkbox (via @radix-ui/react-use-size)
// calls it unconditionally on mount, so without this stub every test that
// reaches step 3 throws before the checkbox-coercion assertion runs.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

const signUp = vi.fn().mockResolvedValue(undefined)

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signUp }),
}))

// vitest.config.ts does not set test.globals, so @testing-library/react's
// automatic afterEach(cleanup) never registers (it only self-installs when
// it detects a global `afterEach`). Without this, Radix's portal-rendered
// Dialog content from one test's render() survives into the next test,
// producing duplicate-element failures (e.g. two "First Name" labels).
afterEach(cleanup)

function renderModal() {
  return render(
    <SignUpModal open={true} onOpenChange={vi.fn()} onSwitchToSignIn={vi.fn()} onSuccess={vi.fn()} />
  )
}

function fillStep1() {
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: "Jane" } })
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: "Doe" } })
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: "jane@example.com" } })
  fireEvent.click(screen.getByRole("button", { name: /next/i }))
}

describe("SignUpModal", () => {
  it("preserves step 1 field values after navigating to step 2 and back (shouldUnregister regression guard)", async () => {
    renderModal()
    fillStep1()

    expect(await screen.findByLabelText(/^password$/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /back/i }))

    expect(await screen.findByLabelText(/first name/i)).toHaveValue("Jane")
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Doe")
    expect(screen.getByLabelText(/email address/i)).toHaveValue("jane@example.com")
  })

  it("renders occupation status as a native <select> element (native-select regression guard)", async () => {
    renderModal()
    fillStep1()

    const occupationField = await screen.findByLabelText(/current status/i)
    expect(occupationField.tagName).toBe("SELECT")
  })

  it("submits successfully when the terms checkbox is checked (checkbox-coercion regression guard)", async () => {
    renderModal()
    fillStep1()

    fireEvent.change(await screen.findByLabelText(/^password$/i), { target: { value: "password1" } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password1" } })
    fireEvent.change(screen.getByLabelText(/zip code/i), { target: { value: "12345" } })
    fireEvent.change(screen.getByLabelText(/current status/i), { target: { value: "Entrepreneur" } })
    fireEvent.click(screen.getByRole("button", { name: /next/i }))

    const checkbox = await screen.findByRole("checkbox")
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole("button", { name: /create account/i }))

    await waitFor(() => expect(signUp).toHaveBeenCalledTimes(1))
  })
})
