import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ServiceProvider } from './providers/ServiceProvider'

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
    fromDate: vi.fn(() => ({ toDate: () => new Date() })),
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}))

vi.mock('./lib/firebase', () => ({
  auth: {},
  db: {},
  hasFirebaseConfig: true,
}))

import { App } from './App'

function renderApp() {
  const testQueryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={testQueryClient}>
      <ServiceProvider>
        <App />
      </ServiceProvider>
    </QueryClientProvider>
  )
}

describe('Milestone 1 app shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
    mockOnAuthStateChanged.mockImplementation(
      (_auth: unknown, callback: (user: unknown) => void) => {
        callback(null)
        return vi.fn()
      }
    )
  })

  it('renders auth screen for unauthenticated users', async () => {
    renderApp()

    expect(
      await screen.findByRole('heading', {
        name: 'One calm place for training, recovery, nutrition, and wellbeing',
      })
    ).toBeInTheDocument()
    expect(screen.getByText(/Cleo Aura Fitness/i)).toBeInTheDocument()
    expect(screen.getByText('Trainer')).toBeInTheDocument()
    expect(screen.getByText('Counsellor')).toBeInTheDocument()
    const loginButtons = screen.getAllByRole('button', { name: 'Login' })
    expect(loginButtons.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
  })

  it('shows role-selected signup context when switching to sign up', async () => {
    renderApp()

    const signUpButton = await screen.findByRole('button', { name: 'Sign up' })
    fireEvent.click(signUpButton)

    expect(screen.getByText(/Signing up as/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
  })
})
