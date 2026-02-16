import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
  type Firestore,
} from 'firebase/firestore'
import { Session, type SessionDraft } from '../domain/Session'
import { sessionDraftSchema } from '@repo/shared'

export class SessionService {
  constructor(private readonly db: Firestore) {}

  async list(filter: 'all' | 'upcoming' = 'upcoming'): Promise<Session[]> {
    const now = Timestamp.now()
    const constraints =
      filter === 'upcoming'
        ? [where('scheduledAt', '>', now), orderBy('scheduledAt', 'asc')]
        : [orderBy('scheduledAt', 'desc')]

    const snap = await getDocs(query(collection(this.db, 'sessions'), ...constraints))
    return snap.docs.map(Session.fromFirestore)
  }

  async create(draft: SessionDraft): Promise<void> {
    const validated = sessionDraftSchema.parse(draft)
    const scheduled = Timestamp.fromDate(validated.scheduledAt)
    await addDoc(collection(this.db, 'sessions'), {
      title: validated.title,
      description: validated.description,
      audience: validated.audience,
      scheduledAt: scheduled,
      createdAt: serverTimestamp(),
      createdByUid: validated.createdByUid,
      createdByRole: validated.createdByRole,
      createdByName: validated.createdByName,
      isDefault: validated.isDefault ?? false,
    })
  }
}
