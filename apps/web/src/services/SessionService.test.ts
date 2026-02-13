import { describe, expect, it, vi } from 'vitest'
import { SessionService } from './SessionService'

let addDocMock: ReturnType<typeof vi.fn>
let getDocsMock: ReturnType<typeof vi.fn>
let collectionMock: ReturnType<typeof vi.fn>
let queryMock: ReturnType<typeof vi.fn>
let orderByMock: ReturnType<typeof vi.fn>
let whereMock: ReturnType<typeof vi.fn>
let serverTimestampMock: ReturnType<typeof vi.fn>
let timestampNowMock: ReturnType<typeof vi.fn>
let timestampFromDateMock: ReturnType<typeof vi.fn>

vi.mock('firebase/firestore', () => {
  addDocMock = vi.fn()
  getDocsMock = vi.fn()
  collectionMock = vi.fn(() => 'collection')
  queryMock = vi.fn((_c, ...args) => ({ queryArgs: args }))
  orderByMock = vi.fn(arg => ({ orderBy: arg }))
  whereMock = vi.fn(arg => ({ where: arg }))
  serverTimestampMock = vi.fn(() => 'server-ts')
  timestampNowMock = vi.fn(() => ({ now: true }))
  timestampFromDateMock = vi.fn(date => ({ fromDate: date }))

  return {
    addDoc: addDocMock,
    getDocs: getDocsMock,
    collection: collectionMock,
    query: queryMock,
    orderBy: orderByMock,
    where: whereMock,
    serverTimestamp: serverTimestampMock,
    Timestamp: {
      now: timestampNowMock,
      fromDate: timestampFromDateMock,
    },
  }
})

describe('SessionService', () => {
  const service = new SessionService({} as never)

  it('creates a session with derived fields', async () => {
    const draft = {
      title: 'Title',
      description: 'Desc',
      audience: 'trainee' as const,
      scheduledAt: new Date('2026-02-13T10:00:00Z'),
      createdByUid: 'uid1',
      createdByRole: 'trainer' as const,
      createdByName: 'Coach',
      isDefault: true,
    }

    await service.create(draft)

    expect(collectionMock).toHaveBeenCalledWith({}, 'sessions')
    expect(addDocMock).toHaveBeenCalledTimes(1)
    const payload = addDocMock.mock.calls[0][1]
    expect(payload.title).toBe('Title')
    expect(payload.isDefault).toBe(true)
    expect(timestampFromDateMock).toHaveBeenCalledWith(draft.scheduledAt)
    expect(serverTimestampMock).toHaveBeenCalled()
  })

  it('maps sessions from Firestore', async () => {
    getDocsMock.mockResolvedValueOnce({
      docs: [
        {
          id: 's1',
          data: () => ({
            title: 'Consult',
            description: 'Intro',
            audience: 'trainee',
            scheduledAt: { seconds: 1 },
            createdAt: { seconds: 0 },
            createdByUid: 'uid1',
            createdByRole: 'trainer',
            createdByName: 'Coach',
            isDefault: true,
          }),
        },
      ],
    })

    const result = await service.list('all')

    expect(queryMock).toHaveBeenCalled()
    expect(orderByMock).toHaveBeenCalled()
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('s1')
    expect(result[0].isDefault).toBe(true)
  })
})
