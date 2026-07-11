import { beforeEach, describe, expect, it, vi } from 'vitest'

const findByIdAndUpdateMock = vi.fn()
const findByIdMock = vi.fn()
const selectMock = vi.fn()
const findOneMock = vi.fn()
const createMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed-password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}))

vi.mock('@/models/User', () => ({
  default: {
    findByIdAndUpdate: (...args: unknown[]) => findByIdAndUpdateMock(...args),
    findById: (...args: unknown[]) => {
      findByIdMock(...args)
      return { select: (...selectArgs: unknown[]) => selectMock(...selectArgs) }
    },
    findOne: (...args: unknown[]) => findOneMock(...args),
    create: (...args: unknown[]) => createMock(...args),
  },
}))

import { AuthService } from './auth'

describe('AuthService email normalization (WAS-19)', () => {
  beforeEach(() => {
    findOneMock.mockReset()
    createMock.mockReset()
  })

  it('signUp lowercases and trims the email before checking for an existing user and before creating', async () => {
    findOneMock.mockResolvedValue(null)
    createMock.mockResolvedValue({ _id: 'user-a', email: 'foo@x.com' })

    await AuthService.signUp({
      email: '  Foo@X.com  ',
      password: 'password123',
      firstName: 'Foo',
      lastName: 'Bar',
      zip_code: '90210',
      occupationStatus: 'Working Professional',
    })

    expect(findOneMock).toHaveBeenCalledWith({ email: 'foo@x.com' })
    const [createArgs] = createMock.mock.calls[0]
    expect(createArgs.email).toBe('foo@x.com')
  })

  it('signUp rejects a signup whose normalized email already exists, even with different casing', async () => {
    findOneMock.mockResolvedValue({ _id: 'existing-user', email: 'foo@x.com' })

    await expect(
      AuthService.signUp({
        email: 'FOO@x.com',
        password: 'password123',
        firstName: 'Foo',
        lastName: 'Bar',
        zip_code: '90210',
        occupationStatus: 'Working Professional',
      })
    ).rejects.toThrow('User already exists')

    expect(findOneMock).toHaveBeenCalledWith({ email: 'foo@x.com' })
    expect(createMock).not.toHaveBeenCalled()
  })

  it('signIn lowercases and trims the email before querying', async () => {
    findOneMock.mockResolvedValue({ _id: 'user-a', email: 'foo@x.com', passwordHash: 'hashed-password' })

    await AuthService.signIn('  Foo@X.com  ', 'password123')

    expect(findOneMock).toHaveBeenCalledWith({ email: 'foo@x.com' })
  })
})

describe('AuthService.updateUserProfile (same mass-assignment bug class as WAS-6)', () => {
  beforeEach(() => {
    findByIdAndUpdateMock.mockReset()
  })

  it('never mass-assigns passwordHash or email from caller-supplied updates', async () => {
    findByIdAndUpdateMock.mockResolvedValue({ _id: 'user-a', first_name: 'New' })

    await AuthService.updateUserProfile('user-a', {
      first_name: 'New',
      passwordHash: 'attacker-controlled-hash',
      email: 'attacker@example.com',
    } as never)

    expect(findByIdAndUpdateMock).toHaveBeenCalledTimes(1)
    const [, update] = findByIdAndUpdateMock.mock.calls[0]
    expect(update).toHaveProperty('first_name', 'New')
    expect(update).not.toHaveProperty('passwordHash')
    expect(update).not.toHaveProperty('email')
  })

  it('allows the intended profile fields through', async () => {
    findByIdAndUpdateMock.mockResolvedValue({ _id: 'user-a' })

    await AuthService.updateUserProfile('user-a', {
      first_name: 'New',
      last_name: 'Name',
      zip_code: '90210',
      occupation_status: 'retired',
    })

    const [, update] = findByIdAndUpdateMock.mock.calls[0]
    expect(update).toEqual({
      first_name: 'New',
      last_name: 'Name',
      zip_code: '90210',
      occupation_status: 'retired',
    })
  })
})

describe('AuthService.getUserProfile (WAS-7: never leak passwordHash)', () => {
  beforeEach(() => {
    findByIdMock.mockReset()
    selectMock.mockReset()
  })

  it('excludes passwordHash from the query projection', async () => {
    selectMock.mockResolvedValue({ _id: 'user-a', email: 'me@example.com' })

    await AuthService.getUserProfile('user-a')

    expect(findByIdMock).toHaveBeenCalledWith('user-a')
    expect(selectMock).toHaveBeenCalledWith('-passwordHash')
  })
})
