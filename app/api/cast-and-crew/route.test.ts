import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'

const loadCastAndCrewMock = vi.fn()
vi.mock('@/lib/cast-crew-loader', () => ({
  loadCastAndCrew: (...args: unknown[]) => loadCastAndCrewMock(...args),
}))

const reportServerErrorMock = vi.fn()
vi.mock('@/lib/server-error', () => ({
  reportServerError: (...args: unknown[]) => reportServerErrorMock(...args),
}))

describe('GET /api/cast-and-crew', () => {
  beforeEach(() => {
    loadCastAndCrewMock.mockReset()
    reportServerErrorMock.mockReset()
  })

  it('returns the cast and crew list', async () => {
    loadCastAndCrewMock.mockReturnValue([{ name: 'Jane Doe', role: 'Director' }])

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ name: 'Jane Doe', role: 'Director' }])
    expect(reportServerErrorMock).not.toHaveBeenCalled()
  })

  it('returns a generic error instead of the raw error message on a load failure', async () => {
    const rawError = new Error('ENOENT: no such file or directory, /var/task/content/cast-and-crew')
    loadCastAndCrewMock.mockImplementation(() => {
      throw rawError
    })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(500)
    expect(json).toEqual({ error: 'Failed to load cast and crew' })
    expect(reportServerErrorMock).toHaveBeenCalledWith('Failed to load cast and crew:', rawError)
  })
})
