import { useQuery } from '@tanstack/react-query'
import {
  collectionGroup,
  getDocs,
  query,
  where,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import type { Invite } from '@repo/shared'

type IncomingInvite = Invite & { path: string }

async function fetchIncomingInvites(email: string, firestore: Firestore): Promise<IncomingInvite[]> {
  const q = query(
    collectionGroup(firestore, 'invites'),
    where('targetEmail', '==', email.toLowerCase()),
    where('status', '==', 'pending')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((docSnap: QueryDocumentSnapshot) => {
    const data = docSnap.data() as Invite & { targetEmail?: string }
    return { ...(data as Invite), path: docSnap.ref.path }
  })
}

export function useIncomingInvites(email: string | null | undefined) {
  return useQuery({
    enabled: Boolean(email),
    queryKey: ['incomingInvites', email?.toLowerCase()],
    queryFn: () => fetchIncomingInvites(email!.toLowerCase(), db),
  })
}
