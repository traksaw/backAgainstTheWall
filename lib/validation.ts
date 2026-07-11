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

const archetypeSchema = z.enum(["Avoider", "Gambler", "Realist", "Architect"])

const quizAnswerSchema = z.object({
  archetype: archetypeSchema,
  points: z.number(),
})

export const quizSubmitSchema = z.object({
  answers: z.record(quizAnswerSchema),
  sessionId: z.string().optional(),
  archetype: archetypeSchema,
  score: z.number(),
})

export const quizUpdateSchema = z.object({
  hasViewedResults: z.boolean().optional(),
  hasWatchedFilm: z.boolean().optional(),
})
