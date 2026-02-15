import { Timestamp, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'

export type SessionAudience = 'trainee' | 'trainer' | 'nutritionist' | 'counsellor' | 'all'
export type SessionCreatorRole = 'trainer' | 'nutritionist' | 'counsellor'

export type SessionDraft = {
  title: string
  description: string
  audience: SessionAudience
  scheduledAt: Date
  createdByUid: string
  createdByRole: SessionCreatorRole
  createdByName: string
  isDefault?: boolean
}

export class Session {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly audience: SessionAudience,
    public readonly scheduledAt: Timestamp | null,
    public readonly createdAt: Timestamp | null,
    public readonly createdByUid: string,
    public readonly createdByRole: SessionCreatorRole,
    public readonly createdByName: string,
    public readonly isDefault: boolean
  ) {}

  static fromFirestore(doc: QueryDocumentSnapshot<DocumentData>): Session {
    const data = doc.data()
    return new Session(
      doc.id,
      data.title ?? '',
      data.description ?? '',
      data.audience ?? 'all',
      data.scheduledAt ?? null,
      data.createdAt ?? null,
      data.createdByUid ?? '',
      data.createdByRole ?? 'trainer',
      data.createdByName ?? '',
      data.isDefault === true
    )
  }
}
