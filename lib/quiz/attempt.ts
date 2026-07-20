import type { QuizAnswer, QuizQuestion } from "@/types/quiz"

export type LayoutValidationResult =
  | { ok: true }
  | { ok: false; reason: string }

/**
 * WAS-107: verify each submitted answer matches an option the server actually
 * showed at that display index for this attempt. Rejects wrong count, missing
 * indices, and {archetype, points} pairs that were never on the shown layout.
 */
export function validateAnswersAgainstLayout(
  answers: Record<string | number, Pick<QuizAnswer, "archetype" | "points">>,
  layout: QuizQuestion[]
): LayoutValidationResult {
  const keys = Object.keys(answers)
  if (keys.length !== layout.length) {
    return {
      ok: false,
      reason: `expected ${layout.length} answers, got ${keys.length}`,
    }
  }

  for (let i = 0; i < layout.length; i++) {
    const answer = answers[i] ?? answers[String(i)]
    if (!answer) {
      return { ok: false, reason: `missing answer for question index ${i}` }
    }

    const question = layout[i]
    const match = question.options.some(
      (opt) =>
        opt.archetype === answer.archetype && opt.points === answer.points
    )
    if (!match) {
      return {
        ok: false,
        reason: `answer at index ${i} does not match any shown option`,
      }
    }
  }

  return { ok: true }
}

/** Default attempt lifetime before TTL expiry (24 hours). */
export const QUIZ_ATTEMPT_TTL_MS = 24 * 60 * 60 * 1000
