// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent, cleanup } from "@testing-library/react"
import { ResultsModal } from "./ResultsModal"
import type { QuizResult } from "@/types/quiz"

// jsdom has no ResizeObserver. Radix's Dialog primitives touch it during
// mount, so without this stub the render throws before assertions run.
if (typeof globalThis.ResizeObserver === "undefined") {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}

// jsdom has no IntersectionObserver. The FadeIn wrappers used throughout
// ResultsModal touch it on mount, so without this stub the render throws
// before assertions run.
if (typeof globalThis.IntersectionObserver === "undefined") {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = IntersectionObserverStub as unknown as typeof IntersectionObserver
}

const latestResult: QuizResult = {
  archetype: "Realist",
  score: 30,
  scores: { Avoider: 5, Gambler: 5, Realist: 30, Architect: 10 },
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) } as Response))
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("ResultsModal result tabs", () => {
  it("exposes the tab buttons as a tablist with correct aria-selected state", () => {
    render(
      <ResultsModal
        open={true}
        onOpenChange={vi.fn()}
        latestResult={latestResult}
        onResultsViewed={vi.fn()}
      />
    )

    const tablist = screen.getByRole("tablist")
    const tabs = screen.getAllByRole("tab")
    expect(tabs).toHaveLength(2)
    expect(tablist).toContainElement(tabs[0])

    const personalityTab = screen.getByRole("tab", { name: "PERSONALITY" })
    const recommendationsTab = screen.getByRole("tab", { name: "RECOMMENDATIONS" })
    expect(personalityTab).toHaveAttribute("aria-selected", "true")
    expect(recommendationsTab).toHaveAttribute("aria-selected", "false")
  })

  it("switches the selected tab and moves focus with the right arrow key", () => {
    render(
      <ResultsModal
        open={true}
        onOpenChange={vi.fn()}
        latestResult={latestResult}
        onResultsViewed={vi.fn()}
      />
    )

    const personalityTab = screen.getByRole("tab", { name: "PERSONALITY" })
    const recommendationsTab = screen.getByRole("tab", { name: "RECOMMENDATIONS" })

    personalityTab.focus()
    fireEvent.keyDown(personalityTab, { key: "ArrowRight" })

    expect(recommendationsTab).toHaveAttribute("aria-selected", "true")
    expect(personalityTab).toHaveAttribute("aria-selected", "false")
    expect(document.activeElement).toBe(recommendationsTab)
  })

  it("wraps focus from the last tab back to the first with the right arrow key", () => {
    render(
      <ResultsModal
        open={true}
        onOpenChange={vi.fn()}
        latestResult={latestResult}
        onResultsViewed={vi.fn()}
      />
    )

    const personalityTab = screen.getByRole("tab", { name: "PERSONALITY" })
    const recommendationsTab = screen.getByRole("tab", { name: "RECOMMENDATIONS" })

    recommendationsTab.focus()
    fireEvent.click(recommendationsTab)
    fireEvent.keyDown(recommendationsTab, { key: "ArrowRight" })

    expect(personalityTab).toHaveAttribute("aria-selected", "true")
    expect(document.activeElement).toBe(personalityTab)
  })
})
