import { describe, expect, it } from "vitest"
import { validateAnswersAgainstLayout } from "./attempt"
import type { QuizQuestion } from "@/types/quiz"

const layout: QuizQuestion[] = [
  {
    id: 1,
    text: "Q1",
    options: [
      { id: 1, text: "A", archetype: "Avoider", points: 5 },
      { id: 2, text: "B", archetype: "Gambler", points: 4 },
      { id: 3, text: "C", archetype: "Realist", points: 3 },
      { id: 4, text: "D", archetype: "Architect", points: 2 },
    ],
  },
  {
    id: 2,
    text: "Q2",
    options: [
      { id: 1, text: "E", archetype: "Architect", points: 5 },
      { id: 2, text: "F", archetype: "Realist", points: 4 },
      { id: 3, text: "G", archetype: "Gambler", points: 3 },
      { id: 4, text: "H", archetype: "Avoider", points: 2 },
    ],
  },
]

describe("validateAnswersAgainstLayout (WAS-107)", () => {
  it("accepts answers that match shown options at each index", () => {
    const result = validateAnswersAgainstLayout(
      {
        0: { archetype: "Avoider", points: 5 },
        1: { archetype: "Realist", points: 4 },
      },
      layout
    )
    expect(result).toEqual({ ok: true })
  })

  it("rejects when answer count does not match layout length", () => {
    const result = validateAnswersAgainstLayout(
      { 0: { archetype: "Avoider", points: 5 } },
      layout
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/expected 2 answers/)
    }
  })

  it("rejects a crafted answer that was not shown at that position", () => {
    // Avoider with 5 was shown at index 0, but at index 1 Avoider only has 2
    const result = validateAnswersAgainstLayout(
      {
        0: { archetype: "Avoider", points: 5 },
        1: { archetype: "Avoider", points: 5 },
      },
      layout
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/index 1/)
    }
  })

  it("rejects when an index is missing even if count matches via wrong keys", () => {
    const result = validateAnswersAgainstLayout(
      {
        0: { archetype: "Avoider", points: 5 },
        2: { archetype: "Architect", points: 5 },
      },
      layout
    )
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.reason).toMatch(/missing answer for question index 1/)
    }
  })
})
