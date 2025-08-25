import { groq } from 'next-sanity'

export const ARCHETYPES_QUERY = groq`
  *[_type == "archetype" && (published == true || !defined(published))] | order(order asc) {
    _id,
    key,
    summary,
    strengths,
    blindSpots,
    reflectionQuestion,
    filmCharacterTieIn,
    exploration {
      description,
      tips,
      resources,
      nextSteps
    }
  }
`

export const QUIZ_QUESTIONS_QUERY = groq`
  *[_type == "quizQuestion" && (published == true || !defined(published))] | order(questionId asc) {
    _id,
    questionId,
    text,
    helpText,
    options[]{
      text,
      archetype
    }
  }
`
