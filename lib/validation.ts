// lib/validation.ts
//
// WAS-8: every API route must validate req.json() against a zod schema
// before it touches the database. Mongoose queries like
// User.findOne({ email }) trust that `email` is already a string - pass an
// object instead (e.g. { "$ne": null }) and it becomes a Mongo query
// operator, not a value. z.string()/z.number()/etc. reject anything that
// isn't the primitive type, which closes that whole bug class at the
// boundary instead of at each call site.

import { z } from "zod"

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  zip_code: z.string().min(1),
  occupationStatus: z.string().min(1),
})

export const requestResetSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1),
})

export const verifyEmailSchema = z.object({
  token: z.string().min(1),
})

export const resendVerificationSchema = z.object({
  email: z.string().email(),
})

const archetypeSchema = z.enum(["Avoider", "Gambler", "Realist", "Architect"])

// WAS-89: every quiz option is worth 1-5 points (see validateQuizIntegrity in
// lib/quiz/questions.ts) - bound `points` to that range so a client can't
// forge an answer worth more than any real option to inflate its score.
const quizAnswerSchema = z.object({
  archetype: archetypeSchema,
  points: z.number().int().min(1).max(5),
})

// WAS-89: archetype/score are recomputed server-side from `answers` in
// app/api/quiz/submit/route.ts - they are intentionally NOT accepted here so
// a client can never write an arbitrary result to the database.
export const quizSubmitSchema = z.object({
  answers: z.record(quizAnswerSchema),
  sessionId: z.string().optional(),
})

export const quizUpdateSchema = z.object({
  hasViewedResults: z.boolean().optional(),
  hasWatchedFilm: z.boolean().optional(),
})
