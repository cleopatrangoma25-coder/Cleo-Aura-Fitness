import { useEffect, useState, useCallback } from 'react'
import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

export type SessionOffer = {
  id: string
  title: string
  description: string
  audience: 'trainee' | 'trainer' | 'nutritionist' | 'all'
  scheduledAt: Timestamp | null
  createdAt: Timestamp | null
  createdByUid: string
  createdByRole: 'trainer' | 'nutritionist' | 'counsellor'
  createdByName: string
}

export function useSessions(roleFilter: 'all' | 'upcoming' = 'upcoming') {
  const [sessions, setSessions] = useState<SessionOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = Timestamp.now()
      const constraints =
        roleFilter === 'upcoming'
          ? [where('scheduledAt', '>', now), orderBy('scheduledAt', 'asc')]
          : [orderBy('scheduledAt', 'desc')]
      const snap = await getDocs(query(collection(db, 'sessions'), ...constraints))
      const mapped = snap.docs.map(docSnap => {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          title: data.title ?? '',
          description: data.description ?? '',
          audience: data.audience ?? 'all',
          scheduledAt: data.scheduledAt ?? null,
          createdAt: data.createdAt ?? null,
          createdByUid: data.createdByUid ?? '',
          createdByRole: data.createdByRole ?? 'trainer',
          createdByName: data.createdByName ?? '',
        } as SessionOffer
      })
      setSessions(mapped)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load sessions.')
    } finally {
      setLoading(false)
    }
  }, [roleFilter])

  useEffect(() => {
    void load()
  }, [load])

  return { sessions, loading, error, reload: load }
}

export async function createSessionOffer(params: {
  title: string
  description: string
  audience: 'trainee' | 'trainer' | 'nutritionist' | 'all'
  scheduledAt: Date
  createdByUid: string
  createdByRole: 'trainer' | 'nutritionist' | 'counsellor'
  createdByName: string
}) {
  const scheduled = Timestamp.fromDate(params.scheduledAt)
  await addDoc(collection(db, 'sessions'), {
    title: params.title,
    description: params.description,
    audience: params.audience,
    scheduledAt: scheduled,
    createdAt: serverTimestamp(),
    createdByUid: params.createdByUid,
    createdByRole: params.createdByRole,
    createdByName: params.createdByName,
  })
}
