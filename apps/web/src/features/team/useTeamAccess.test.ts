import { describe, expect, it, vi } from 'vitest'
import { acceptInvite } from './useTeamAccess'

const mockUpdateDoc = vi.fn()
const mockSetDoc = vi.fn()
const mockGetDoc = vi.fn()

vi.mock('firebase/firestore', () => ({
  doc: vi.fn((...segments: string[]) => ({ segments })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  updateDoc: (...args: unknown[]) => mockUpdateDoc(...args),
  serverTimestamp: () => 'server-ts',
  Timestamp: {
    fromMillis: () => ({}),
  },
}))

vi.mock('../../lib/firebase', () => ({
  db: {} as never,
  hasFirebaseConfig: false,
}))

const firestore = {} as never
const user = {
  uid: 'pro-1',
  email: 'coach@example.com',
  displayName: 'Coach',
  role: 'trainer' as const,
}

describe('acceptInvite', () => {
  it('rejects when invite targetEmail does not match user email', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        status: 'pending',
        role: 'trainer',
        traineeId: 't1',
        targetEmail: 'someoneelse@example.com',
      }),
    })

    await expect(
      acceptInvite({ firestore, traineeId: 'trainee-1', code: 'ABC123', user })
    ).rejects.toThrow(/different email/i)
  })

  it('succeeds when emails match (case-insensitive)', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        status: 'pending',
        role: 'trainer',
        traineeId: 't1',
        targetEmail: 'coach@EXAMPLE.com',
      }),
    })
    mockUpdateDoc.mockResolvedValue(undefined)
    mockSetDoc.mockResolvedValue(undefined)

    await acceptInvite({ firestore, traineeId: 'trainee-1', code: 'ABC123', user })

    expect(mockUpdateDoc).toHaveBeenCalled()
    expect(mockSetDoc).toHaveBeenCalled()
  })
})
