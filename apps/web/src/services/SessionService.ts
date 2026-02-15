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
    const scheduled = Timestamp.fromDate(draft.scheduledAt)
    await addDoc(collection(this.db, 'sessions'), {
      title: draft.title,
      description: draft.description,
      audience: draft.audience,
      scheduledAt: scheduled,
      createdAt: serverTimestamp(),
      createdByUid: draft.createdByUid,
      createdByRole: draft.createdByRole,
      createdByName: draft.createdByName,
      isDefault: draft.isDefault ?? false,
    })
  }
}
