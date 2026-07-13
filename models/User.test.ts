import { describe, expect, it } from 'vitest'
import UserModel from './User'

describe('UserSchema (WAS-11: passwordHash must be select:false at the schema level)', () => {
  it('excludes passwordHash from query results by default', () => {
    const path = UserModel.schema.path('passwordHash')
    expect(path.options.select).toBe(false)
  })
})
