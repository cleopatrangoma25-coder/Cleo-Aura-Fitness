import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore'
import { Enrollment } from '../domain/Enrollment'

export class EnrollmentService {
  constructor(private readonly db: Firestore) {}

  async listByTrainee(traineeId: string): Promise<Enrollment[]> {
    const snap = await getDocs(
      query(
        collection(this.db, 'sessionEnrollments'),
        where('traineeId', '==', traineeId),
        orderBy('createdAt', 'desc')
      )
    )
    return snap.docs.map(Enrollment.fromFirestore)
  }

  async enroll(sessionId: string, traineeId: string): Promise<void> {
    const enrollmentId = `${sessionId}_${traineeId}`
    await setDoc(doc(this.db, 'sessionEnrollments', enrollmentId), {
      sessionId,
      traineeId,
      createdAt: serverTimestamp(),
    })
  }

  async cancel(sessionId: string, traineeId: string): Promise<void> {
    const enrollmentId = `${sessionId}_${traineeId}`
    await deleteDoc(doc(this.db, 'sessionEnrollments', enrollmentId))
  }
}
