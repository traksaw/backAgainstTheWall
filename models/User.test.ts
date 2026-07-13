import { describe, expect, it } from 'vitest'
import UserModel from './User'

describe('UserSchema (WAS-11: passwordHash must be select:false at the schema level)', () => {
  it('excludes passwordHash from query results by default', () => {
    const path = UserModel.schema.path('passwordHash')
    expect(path.options.select).toBe(false)
  })
})

describe('UserSchema (WAS-11 follow-up: token-hash fields get the same schema-level guard)', () => {
  it.each(['resetPasswordTokenHash', 'emailVerificationTokenHash'])(
    'excludes %s from query results by default',
    (fieldName) => {
      const path = UserModel.schema.path(fieldName)
      expect(path.options.select).toBe(false)
    }
  )
})

describe('UserSchema (WAS-11 follow-up: toJSON strips secrets even if re-selected)', () => {
  it('never includes passwordHash or token-hash fields in a serialized document', () => {
    const doc = new UserModel({
      email: 'me@example.com',
      passwordHash: 'super-secret-hash',
      resetPasswordTokenHash: 'reset-hash',
      emailVerificationTokenHash: 'verify-hash',
    })

    const serialized = doc.toJSON()

    expect(serialized).not.toHaveProperty('passwordHash')
    expect(serialized).not.toHaveProperty('resetPasswordTokenHash')
    expect(serialized).not.toHaveProperty('emailVerificationTokenHash')
    // sanity check the transform isn't just deleting everything
    expect(serialized.email).toBe('me@example.com')
  })
})
