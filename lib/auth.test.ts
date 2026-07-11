import { beforeEach, describe, expect, it, vi } from 'vitest'

const findByIdAndUpdateMock = vi.fn()

vi.mock('@/lib/mongoose', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/models/User', () => ({
  default: {
    findByIdAndUpdate: (...args: unknown[]) => findByIdAndUpdateMock(...args),
  },
}))

import { AuthService } from './auth'

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
