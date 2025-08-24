import { serverClient } from '@/sanity/serverClient'
import { ARCHETYPES_QUERY, QUIZ_QUESTIONS_QUERY } from '@/sanity/queries/quiz'
import type { Archetype, ArchetypeResult, QuizQuestion } from '@/types/quiz'
import { archetypeResults as staticArchetypeResults } from './archetypes'
import { quizQuestions as staticQuizQuestions } from './questions'

function mapArchetypeDocToResult(doc: any): ArchetypeResult | null {
  const key = doc?.key as Archetype
  if (!key) return null
  return {
    archetype: key,
    summary: doc.summary || '',
    strengths: doc.strengths || [],
    blindSpots: doc.blindSpots || [],
    reflectionQuestion: doc.reflectionQuestion || '',
    filmCharacterTieIn: doc.filmCharacterTieIn || '',
    exploration: {
      description: doc.exploration?.description || '',
      tips: doc.exploration?.tips || [],
      resources: doc.exploration?.resources || [],
      nextSteps: doc.exploration?.nextSteps || [],
    },
  }
}

function mapQuestionDocToQuestion(doc: any): QuizQuestion | null {
  if (!doc?.questionId || !doc?.text || !Array.isArray(doc?.options)) return null
  return {
    id: doc.questionId,
    text: doc.text,
    options: doc.options.map((opt: any, idx: number) => ({
      id: idx + 1,
      text: opt.text,
      archetype: opt.archetype,
      points: typeof opt.points === 'number' ? opt.points : 3,
      question: doc.text,
    })),
  }
}

export async function fetchArchetypeResults(): Promise<Record<Archetype, ArchetypeResult>> {
  try {
    const docs = await serverClient.fetch(ARCHETYPES_QUERY)
    const mapped = (docs || [])
      .map(mapArchetypeDocToResult)
      .filter(Boolean) as ArchetypeResult[]

    // Build record keyed by archetype
    const record = mapped.reduce((acc, item) => {
      acc[item.archetype] = item
      return acc
    }, {} as Record<Archetype, ArchetypeResult>)

    // Ensure all four archetypes exist; if missing, fill from static
    const required: Archetype[] = ['Avoider', 'Gambler', 'Realist', 'Architect']
    for (const a of required) {
      if (!record[a] && staticArchetypeResults[a]) {
        record[a] = staticArchetypeResults[a]
      }
    }

    return record
  } catch (e) {
    console.error('Failed to fetch archetypes from Sanity, using static fallback', e)
    return staticArchetypeResults as Record<Archetype, ArchetypeResult>
  }
}

export async function fetchQuizQuestions(): Promise<QuizQuestion[]> {
  try {
    const docs = await serverClient.fetch(QUIZ_QUESTIONS_QUERY)
    const mapped = (docs || [])
      .map(mapQuestionDocToQuestion)
      .filter(Boolean) as QuizQuestion[]

    // If none loaded, fallback
    if (!mapped.length) return staticQuizQuestions

    return mapped
  } catch (e) {
    console.error('Failed to fetch quiz questions from Sanity, using static fallback', e)
    return staticQuizQuestions
  }
}

export async function fetchQuizContent() {
  const [archetypes, questions] = await Promise.all([
    fetchArchetypeResults(),
    fetchQuizQuestions(),
  ])
  return { archetypes, questions }
}
