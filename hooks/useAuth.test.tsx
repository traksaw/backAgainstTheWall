// hooks/useAuth.test.tsx
// @vitest-environment jsdom
//
// WAS-28 regression guard: signUp/signIn used to be typed `any`, so a payload
// shape drift (missing field, renamed key) would only surface as a silent
// runtime failure. These tests pin the exact request body sent to the API,
// independent of the TypeScript types - they fail on a shape regression even
// if the parameter type were loosened back to `any`.
import { act } from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AuthProvider, useAuth } from "./useAuth"
import type { SignUpData } from "@/lib/auth"

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: async () => body } as Response)
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  fetchMock = vi.fn((url: string) => {
    if (url === "/api/auth/me") return jsonResponse({ _id: "u1", email: "jane@example.com" })
    if (url === "/api/auth/signin") return jsonResponse({ id: "u1", email: "jane@example.com" })
    if (url === "/api/auth/signup") return jsonResponse({ id: "u1", email: "jane@example.com" })
    throw new Error(`Unhandled fetch in test: ${url}`)
  })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function renderAuth() {
  const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider })
  await waitFor(() => expect(result.current.loading).toBe(false))
  return result
}

describe("useAuth", () => {
  it("sends signIn's exact {email, password} shape as the request body", async () => {
    const result = await renderAuth()

    await act(async () => {
      await result.current.signIn({ email: "jane@example.com", password: "password123" })
    })

    const signInCall = fetchMock.mock.calls.find(([url]) => url === "/api/auth/signin")
    expect(signInCall).toBeDefined()
    const [, init] = signInCall!
    expect(JSON.parse(init.body as string)).toEqual({
      email: "jane@example.com",
      password: "password123",
    })
  })

  it("sends signUp's full SignUpData shape as the request body", async () => {
    const result = await renderAuth()

    const payload: SignUpData = {
      email: "jane@example.com",
      password: "password123",
      firstName: "Jane",
      lastName: "Doe",
      zip_code: "12345",
      occupationStatus: "Entrepreneur",
    }

    await act(async () => {
      await result.current.signUp(payload)
    })

    const signUpCall = fetchMock.mock.calls.find(([url]) => url === "/api/auth/signup")
    expect(signUpCall).toBeDefined()
    const [, init] = signUpCall!
    expect(JSON.parse(init.body as string)).toEqual(payload)
  })
})
