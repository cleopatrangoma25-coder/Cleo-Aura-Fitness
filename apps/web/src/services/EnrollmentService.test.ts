import { describe, expect, it, vi } from 'vitest'
import { EnrollmentService } from './EnrollmentService'

let getDocsMock: ReturnType<typeof vi.fn>
let setDocMock: ReturnType<typeof vi.fn>
let deleteDocMock: ReturnType<typeof vi.fn>
let docMock: ReturnType<typeof vi.fn>
let collectionMock: ReturnType<typeof vi.fn>
let queryMock: ReturnType<typeof vi.fn>
let whereMock: ReturnType<typeof vi.fn>
let orderByMock: ReturnType<typeof vi.fn>
let serverTimestampMock: ReturnType<typeof vi.fn>

vi.mock('firebase/firestore', () => {
  getDocsMock = vi.fn()
  setDocMock = vi.fn()
  deleteDocMock = vi.fn()
  docMock = vi.fn((_db, _col, id) => ({ id }))
  collectionMock = vi.fn(() => 'collection')
  queryMock = vi.fn((_c, ...args) => ({ args }))
  whereMock = vi.fn()
  orderByMock = vi.fn()
  serverTimestampMock = vi.fn(() => 'server-ts')

  return {
    getDocs: getDocsMock,
    setDoc: setDocMock,
    deleteDoc: deleteDocMock,
    doc: docMock,
    collection: collectionMock,
    query: queryMock,
    where: whereMock,
    orderBy: orderByMock,
    serverTimestamp: serverTimestampMock,
  }
})

describe('EnrollmentService', () => {
  const service = new EnrollmentService({} as never)

  it('lists enrollments for a trainee', async () => {
    getDocsMock.mockResolvedValueOnce({
      docs: [
        { id: 'sid_uid', data: () => ({ sessionId: 'sid', traineeId: 'uid', createdAt: 'ts' }) },
      ],
    })

    const enrollments = await service.listByTrainee('uid')

    expect(collectionMock).toHaveBeenCalledWith({}, 'sessionEnrollments')
    expect(whereMock).toHaveBeenCalledWith('traineeId', '==', 'uid')
    expect(enrollments).toHaveLength(1)
    expect(enrollments[0].sessionId).toBe('sid')
  })

  it('enrolls and cancels with deterministic ids', async () => {
    await service.enroll('sid', 'uid')
    expect(setDocMock).toHaveBeenCalledWith(
      { id: 'sid_uid' },
      expect.objectContaining({ sessionId: 'sid', traineeId: 'uid', createdAt: 'server-ts' })
    )

    await service.cancel('sid', 'uid')
    expect(deleteDocMock).toHaveBeenCalledWith({ id: 'sid_uid' })
  })
})
