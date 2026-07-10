import { describe, expect, it } from 'vitest'
import { calculateQuizScores, fisherYatesShuffle, getWinningArchetype } from './utils'
import type { Archetype, QuizAnswer } from '@/types/quiz'

function answer(archetype: Archetype, points: number, text = 'answer'): QuizAnswer {
  return { text, archetype, points }
}

/**
 * WAS-9: sample answer sets locked to a fixed expected archetype.
 * Each case is run many times to prove the same answers always resolve
 * to the same archetype (no Math.random() in the scoring/tie-break path).
 */
const DETERMINISM_CASES: Array<{
  name: string
  answers: Record<number, QuizAnswer>
  expected: Archetype
}> = [
  {
    name: 'clear winner, no tie',
    answers: {
      1: answer('Realist', 5),
      2: answer('Realist', 4),
      3: answer('Gambler', 2),
      4: answer('Avoider', 1),
    },
    expected: 'Realist',
  },
  {
    name: 'score tie resolved by recency (Architect appears more in last 5)',
    answers: {
      1: answer('Gambler', 5),
      2: answer('Architect', 1),
      3: answer('Architect', 1),
      4: answer('Architect', 1),
      5: answer('Architect', 2),
    },
    expected: 'Architect',
  },
  {
    name: 'score tie AND recency tie AND weight tie (Gambler vs Architect) falls to fixed priority order',
    answers: {
      1: answer('Gambler', 5),
      2: answer('Architect', 5),
      3: answer('Avoider', 1),
      4: answer('Realist', 1),
    },
    expected: 'Gambler',
  },
]

const RUNS = 50

describe('calculateQuizScores + getWinningArchetype determinism (WAS-9)', () => {
  it.each(DETERMINISM_CASES)('$name', ({ answers, expected }) => {
    const results = new Set<Archetype>()
    for (let i = 0; i < RUNS; i++) {
      const scores = calculateQuizScores(answers)
      results.add(getWinningArchetype(scores, answers))
    }

    expect(results.size).toBe(1)
    expect(results.has(expected)).toBe(true)
  })

  it('throws when all scores are zero instead of guessing', () => {
    const answers: Record<number, QuizAnswer> = {}
    const scores = calculateQuizScores(answers)
    expect(() => getWinningArchetype(scores, answers)).toThrow()
  })
})

describe('fisherYatesShuffle (display-order only, WAS-9)', () => {
  it('returns a permutation of the input without mutating it', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = fisherYatesShuffle(input)

    expect(shuffled).not.toBe(input)
    expect([...shuffled].sort()).toEqual([...input].sort())
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('produces every position with roughly uniform probability (unlike sort(() => Math.random() - 0.5))', () => {
    const positionCounts = [0, 0, 0, 0]
    const runs = 4000
    for (let i = 0; i < runs; i++) {
      const shuffled = fisherYatesShuffle(['a', 'b', 'c', 'd'])
      positionCounts[shuffled.indexOf('a')]++
    }

    const expected = runs / 4
    for (const count of positionCounts) {
      expect(Math.abs(count - expected) / expected).toBeLessThan(0.15)
    }
  })
})
