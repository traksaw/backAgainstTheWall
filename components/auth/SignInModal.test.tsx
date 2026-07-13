// components/auth/SignInModal.test.tsx
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import { SignInModal } from "./SignInModal"

const signIn = vi.fn().mockResolvedValue(undefined)

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ signIn }),
}))

afterEach(cleanup)

function renderModal() {
  return render(
    <SignInModal
      open={true}
      onOpenChange={vi.fn()}
      onSwitchToSignUp={vi.fn()}
      onSwitchToForgotPassword={vi.fn()}
    />
  )
}

describe("SignInModal", () => {
  it("submits signIn with exactly {email, password} (WAS-28 shape regression guard)", async () => {
    renderModal()

    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: "jane@example.com" } })
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "password123" } })
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }))

    await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1))
    expect(signIn).toHaveBeenCalledWith({ email: "jane@example.com", password: "password123" })
  })
})
