import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { axe, toHaveNoViolations } from 'jest-axe'
import { App } from './App'

expect.extend(toHaveNoViolations)

const { mockOnAuthStateChanged } = vi.hoisted(() => ({
  mockOnAuthStateChanged: vi.fn((_auth: unknown, callback: (user: unknown) => void) => {
    callback(null)
    return vi.fn()
  }),
}))

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: mockOnAuthStateChanged,
  createUserWithEmailAndPassword: vi.fn(async () => ({ user: {} })),
  signInWithEmailAndPassword: vi.fn(async () => ({ user: {} })),
  signOut: vi.fn(async () => undefined),
  updateProfile: vi.fn(async () => undefined),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn((_db: unknown, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: vi.fn(async () => undefined),
  updateDoc: vi.fn(async () => undefined),
  serverTimestamp: vi.fn(() => 'timestamp'),
  collection: vi.fn(() => ({})),
  collectionGroup: vi.fn(() => ({})),
  addDoc: vi.fn(async () => ({ id: 'mock-id' })),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})),
  getDocs: vi.fn(async () => ({ docs: [] })),
  Timestamp: {
    fromDate: vi.fn(() => ({})),
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}))

vi.mock('./lib/firebase', () => ({
  auth: {},
  db: {},
  hasFirebaseConfig: true,
}))

describe('App accessibility', () => {
  it('has no axe violations on unauthenticated auth screen', async () => {
    const testQueryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const { container } = render(
      <QueryClientProvider client={testQueryClient}>
        <App />
      </QueryClientProvider>
    )

    // Ensure auth heading is present before running axe
    await screen.findByRole('heading', {
      name: /one calm place for training/i,
    })

    const results = await axe(container, {
      rules: {
        region: { enabled: false }, // false positives on minimal layouts in tests
      },
    })
    expect(results).toHaveNoViolations()
  })
})
