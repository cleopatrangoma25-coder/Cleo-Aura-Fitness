import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

let wired = false

function scrubMessage(message: unknown) {
  if (typeof message === 'string') return message.slice(0, 500)
  if (message instanceof Error) return message.message.slice(0, 500)
  try {
    return JSON.stringify(message).slice(0, 500)
  } catch {
    return 'unknown-error'
  }
}

async function writeError(payload: Record<string, unknown>) {
  try {
    await addDoc(collection(db, 'errorReports'), {
      ...payload,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    // avoid throwing; best-effort logging only
    console.warn('errorReporter failed', error)
  }
}

export function initErrorReporter(userEmail: string | null | undefined) {
  if (wired) return
  wired = true

  window.addEventListener('error', event => {
    void writeError({
      type: 'window.onerror',
      message: scrubMessage(event.error ?? event.message),
      stack: event.error instanceof Error ? event.error.stack?.slice(0, 2000) : null,
      source: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      userEmail: userEmail?.toLowerCase() ?? null,
    })
  })

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason
    void writeError({
      type: 'unhandledrejection',
      message: scrubMessage(reason),
      stack: reason instanceof Error ? reason.stack?.slice(0, 2000) : null,
      userEmail: userEmail?.toLowerCase() ?? null,
    })
  })
}
