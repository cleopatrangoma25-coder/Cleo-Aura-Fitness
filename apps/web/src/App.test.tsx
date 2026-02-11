import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockOnAuthStateChanged = vi.fn((_auth, callback: (user: unknown) => void) => {
  callback(null)
  return vi.fn()
})

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
  doc: vi.fn((_db, ...segments: string[]) => ({ path: segments.join('/') })),
  getDoc: vi.fn(async () => ({ exists: () => false, data: () => ({}) })),
  setDoc: vi.fn(async () => undefined),
  updateDoc: vi.fn(async () => undefined),
  serverTimestamp: vi.fn(() => 'timestamp'),
}))

import { App } from './App'

describe('Milestone 1 app shell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.history.replaceState({}, '', '/')
    mockOnAuthStateChanged.mockImplementation((_auth, callback: (user: unknown) => void) => {
      callback(null)
      return vi.fn()
    })
  })

  it('renders auth screen for unauthenticated users', async () => {
    render(<App />)

    expect(await screen.findByRole('heading', { name: 'Cleo Aura Fitness' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()
  })
})
