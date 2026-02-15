import { Timestamp, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'

export class Enrollment {
  constructor(
    public readonly id: string,
    public readonly sessionId: string,
    public readonly traineeId: string,
    public readonly createdAt: Timestamp | null
  ) {}

  static fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): Enrollment {
    const data = doc.data()
    return new Enrollment(doc.id, data.sessionId ?? '', data.traineeId ?? '', data.createdAt ?? null)
  }
}
