import { FormEvent, useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db, hasFirebaseConfig } from './lib/firebase'

type UserRole = 'trainee' | 'trainer' | 'nutritionist' | 'counsellor'

type ProfileRecord = {
  uid: string
  email: string
  displayName: string
  role: UserRole | null
}

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'trainee', label: 'Trainee' },
  { value: 'trainer', label: 'Trainer' },
  { value: 'nutritionist', label: 'Nutritionist / Dietitian' },
  { value: 'counsellor', label: 'Counsellor' },
]

const ROLE_COPY: Record<UserRole, string> = {
  trainee: 'Trainee base experience: log your fitness and wellbeing in one place.',
  trainer: 'Trainer base experience: review trainee training and recovery trends.',
  nutritionist: 'Nutritionist base experience: review nutrition habits and energy patterns.',
  counsellor: 'Counsellor base experience: review mood, stress, and sleep trends.',
}

function AuthScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const credentials = await createUserWithEmailAndPassword(auth, email.trim(), password)
        if (displayName.trim()) {
          await updateProfile(credentials.user, { displayName: displayName.trim() })
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      }

      navigate('/app')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Authentication failed.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Cleo Aura Fitness</h1>
      <p className="mt-2 text-sm text-slate-600">
        Milestone 1: sign up, log in, and bootstrap your role-based profile.
      </p>

      <div className="mt-4 flex gap-2">
        <button
          className={`rounded px-3 py-2 text-sm ${mode === 'login' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
          onClick={() => setMode('login')}
          type="button"
        >
          Login
        </button>
        <button
          className={`rounded px-3 py-2 text-sm ${mode === 'signup' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}
          onClick={() => setMode('signup')}
          type="button"
        >
          Sign up
        </button>
      </div>

      <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
        {mode === 'signup' ? (
          <label className="grid gap-1 text-sm">
            Display name
            <input
              className="rounded border px-3 py-2"
              onChange={event => setDisplayName(event.target.value)}
              placeholder="Your name"
              value={displayName}
            />
          </label>
        ) : null}

        <label className="grid gap-1 text-sm">
          Email
          <input
            className="rounded border px-3 py-2"
            onChange={event => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-1 text-sm">
          Password
          <input
            className="rounded border px-3 py-2"
            minLength={6}
            onChange={event => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Login'}
        </button>
      </form>
    </section>
  )
}

function RoleSelectionScreen({
  user,
  profile,
  onRoleAssigned,
}: {
  user: User
  profile: ProfileRecord
  onRoleAssigned: (role: UserRole) => void
}) {
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainee')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveRole() {
    if (profile.role) {
      setError('Role is already set and cannot be changed here.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        role: selectedRole,
        updatedAt: serverTimestamp(),
      })

      if (selectedRole === 'trainee') {
        const traineeRef = doc(db, 'trainees', user.uid)
        const traineeSnapshot = await getDoc(traineeRef)

        if (!traineeSnapshot.exists()) {
          await setDoc(traineeRef, {
            uid: user.uid,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        }
      }

      onRoleAssigned(selectedRole)
      navigate('/app')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to save role.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold">Choose your role</h1>
      <p className="mt-2 text-sm text-slate-600">
        This is a one-time selection. Role changes require admin migration rules.
      </p>

      <div className="mt-4 grid gap-2">
        {ROLE_OPTIONS.map(option => (
          <button
            className={`rounded border px-3 py-2 text-left ${
              selectedRole === option.value ? 'border-emerald-600 bg-emerald-50' : 'border-slate-200'
            }`}
            key={option.value}
            onClick={() => setSelectedRole(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        className="mt-4 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={isSaving}
        onClick={saveRole}
        type="button"
      >
        {isSaving ? 'Saving role...' : 'Save role'}
      </button>
    </section>
  )
}

function AppShell({
  user,
  profile,
  onProfileUpdated,
}: {
  user: User
  profile: ProfileRecord
  onProfileUpdated: (displayName: string) => void
}) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [isSavingName, setIsSavingName] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)

  useEffect(() => {
    setDisplayName(profile.displayName)
  }, [profile.displayName])

  const roleLabel = useMemo(() => {
    const option = ROLE_OPTIONS.find(candidate => candidate.value === profile.role)
    return option?.label ?? 'Unknown'
  }, [profile.role])

  async function saveDisplayName() {
    const nextName = displayName.trim()
    if (!nextName) {
      setSettingsMessage('Display name cannot be empty.')
      return
    }

    setIsSavingName(true)
    setSettingsMessage(null)

    try {
      await updateProfile(user, { displayName: nextName })
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: nextName,
        updatedAt: serverTimestamp(),
      })

      onProfileUpdated(nextName)
      setSettingsMessage('Display name updated.')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to update display name.'
      setSettingsMessage(message)
    } finally {
      setIsSavingName(false)
    }
  }

  async function logout() {
    await signOut(auth)
  }

  if (!profile.role) {
    return <Navigate replace to="/role-select" />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold">Cleo Aura Fitness</h1>
          <p className="text-sm text-slate-600">Signed in as {user.email}</p>
        </div>
        <button className="rounded border px-3 py-2 text-sm" onClick={logout} type="button">
          Logout
        </button>
      </header>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Base Experience: {roleLabel}</h2>
        <p className="mt-2 text-sm text-slate-600">{ROLE_COPY[profile.role]}</p>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Account settings</h2>
        <p className="mt-2 text-sm text-slate-600">Role: {roleLabel} (immutable after first selection)</p>

        <label className="mt-4 grid gap-1 text-sm">
          Display name
          <input
            className="rounded border px-3 py-2"
            onChange={event => setDisplayName(event.target.value)}
            value={displayName}
          />
        </label>

        <div className="mt-3 flex gap-2">
          <button
            className="rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
            disabled={isSavingName}
            onClick={saveDisplayName}
            type="button"
          >
            {isSavingName ? 'Saving...' : 'Update display name'}
          </button>
          <Link className="rounded border px-3 py-2 text-sm" to="/app">
            Back to home
          </Link>
        </div>

        {settingsMessage ? <p className="mt-2 text-sm text-slate-600">{settingsMessage}</p> : null}
      </section>
    </div>
  )
}

function MilestoneOneApp() {
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [appError, setAppError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setAuthUser(user)
      setAuthLoading(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    async function bootstrapProfile(currentUser: User) {
      setProfileLoading(true)
      setAppError(null)

      try {
        const userRef = doc(db, 'users', currentUser.uid)
        const snapshot = await getDoc(userRef)

        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<ProfileRecord>
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email ?? '',
            displayName:
              typeof data.displayName === 'string'
                ? data.displayName
                : currentUser.displayName ?? '',
            role: (data.role as UserRole | null) ?? null,
          })
        } else {
          const createdProfile: ProfileRecord = {
            uid: currentUser.uid,
            email: currentUser.email ?? '',
            displayName: currentUser.displayName ?? '',
            role: null,
          }

          await setDoc(userRef, {
            ...createdProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })

          setProfile(createdProfile)
        }
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Failed to load user profile.'
        setAppError(message)
      } finally {
        setProfileLoading(false)
      }
    }

    if (!authUser) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    void bootstrapProfile(authUser)
  }, [authUser])

  if (!hasFirebaseConfig) {
    return (
      <main className="mx-auto mt-10 max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-900">
        Firebase config is missing. Add Vite env vars for auth and Firestore before running Milestone 1.
      </main>
    )
  }

  if (authLoading || profileLoading) {
    return <main className="p-6 text-center text-sm text-slate-600">Loading...</main>
  }

  return (
    <BrowserRouter>
      <main className="min-h-screen bg-slate-50 p-4 md:p-8">
        {appError ? (
          <div className="mx-auto mb-4 w-full max-w-3xl rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {appError}
          </div>
        ) : null}

        <Routes>
          <Route element={authUser ? <Navigate replace to="/app" /> : <AuthScreen />} path="/auth" />
          <Route
            element={
              authUser && profile ? (
                <RoleSelectionScreen
                  onRoleAssigned={role => setProfile(current => (current ? { ...current, role } : current))}
                  profile={profile}
                  user={authUser}
                />
              ) : (
                <Navigate replace to="/auth" />
              )
            }
            path="/role-select"
          />
          <Route
            element={
              authUser && profile ? (
                <AppShell
                  onProfileUpdated={displayName =>
                    setProfile(current => (current ? { ...current, displayName } : current))
                  }
                  profile={profile}
                  user={authUser}
                />
              ) : (
                <Navigate replace to="/auth" />
              )
            }
            path="/app"
          />
          <Route
            element={
              authUser && profile ? (
                <AppShell
                  onProfileUpdated={displayName =>
                    setProfile(current => (current ? { ...current, displayName } : current))
                  }
                  profile={profile}
                  user={authUser}
                />
              ) : (
                <Navigate replace to="/auth" />
              )
            }
            path="/settings"
          />
          <Route element={<Navigate replace to={authUser ? '/app' : '/auth'} />} path="*" />
        </Routes>
      </main>
    </BrowserRouter>
  )
}

export function App() {
  return <MilestoneOneApp />
}
