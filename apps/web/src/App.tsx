import { FormEvent, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { auth, db, hasFirebaseConfig } from './lib/firebase'
import { TraineeDashboard } from './features/dashboard/TraineeDashboard'
import { WorkoutForm } from './features/workouts/WorkoutForm'
import { RecoveryForm } from './features/recovery/RecoveryForm'
import { HistoryTimeline } from './features/timeline/HistoryTimeline'
import { DailyCheckIn } from './features/checkin/DailyCheckIn'
import { TeamAccessManager } from './features/team/TeamAccessManager'
import { InviteAcceptance } from './features/team/InviteAcceptance'
import { ProfessionalClientView } from './features/team/ProfessionalClientView'
import { ProgressMeasurementForm } from './features/progress/ProgressMeasurementForm'
import { ProgressAnalyticsPage } from './features/progress/ProgressAnalyticsPage'

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

function AuthScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<UserRole>('trainee')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleHighlights: Record<UserRole, string> = {
    trainee: 'Track workouts, recovery, nutrition, and wellbeing.',
    trainer: 'Review shared training and recovery trends from clients.',
    nutritionist: 'Review meal habits, hydration, and nutrition notes.',
    counsellor: 'Review mood, stress, sleep, and wellbeing patterns.',
  }

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

        await setDoc(
          doc(db, 'users', credentials.user.uid),
          {
            uid: credentials.user.uid,
            email: credentials.user.email ?? email.trim(),
            displayName: displayName.trim(),
            role: selectedRole,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )

        if (selectedRole === 'trainee') {
          await setDoc(
            doc(db, 'trainees', credentials.user.uid),
            {
              uid: credentials.user.uid,
              ownerId: credentials.user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          )
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
    <section className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[1.2fr_1fr]">
      <article className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-emerald-100 via-cyan-50 to-slate-50 p-6 shadow-sm md:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="relative">
          <p className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-800">
            WELCOME TO CLEO AURA FITNESS
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            One calm place for training, recovery, nutrition, and wellbeing
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-700">
            Start by choosing your role below. New accounts use this role during sign up, and
            existing users can login right away.
          </p>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {ROLE_OPTIONS.map(option => (
              <button
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  selectedRole === option.value
                    ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-slate-200 bg-white/70 hover:border-slate-300'
                }`}
                key={option.value}
                onClick={() => setSelectedRole(option.value)}
                type="button"
              >
                <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                <p className="mt-1 text-xs text-slate-600">{roleHighlights[option.value]}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-white/80 p-3">
              <p className="text-sm font-semibold text-slate-900">Low friction</p>
              <p className="mt-1 text-xs text-slate-600">Daily check-ins are designed for under one minute.</p>
            </div>
            <div className="rounded-xl border border-cyan-200 bg-white/80 p-3">
              <p className="text-sm font-semibold text-slate-900">Private by default</p>
              <p className="mt-1 text-xs text-slate-600">Trainees control exactly what professionals can view.</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 p-3">
              <p className="text-sm font-semibold text-slate-900">Built for progress</p>
              <p className="mt-1 text-xs text-slate-600">Workouts, recovery, nutrition, and wellbeing stay connected.</p>
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
          <button
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'login' ? 'bg-white shadow-sm' : 'text-slate-600'
            }`}
            onClick={() => setMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
              mode === 'signup' ? 'bg-white shadow-sm' : 'text-slate-600'
            }`}
            onClick={() => setMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form className="mt-4 grid gap-3" onSubmit={handleSubmit}>
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Selected role: <span className="font-semibold">{ROLE_OPTIONS.find(o => o.value === selectedRole)?.label}</span>
          </p>
          {mode === 'signup' ? (
            <>
              <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                Signing up as <span className="font-semibold">{ROLE_OPTIONS.find(o => o.value === selectedRole)?.label}</span>
              </p>
              <label className="grid gap-1 text-sm">
                Display name
                <input
                  className="rounded border px-3 py-2"
                  onChange={event => setDisplayName(event.target.value)}
                  placeholder="Your name"
                  required
                  value={displayName}
                />
              </label>
            </>
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

          <p className="text-xs text-slate-500">
            {mode === 'signup'
              ? 'Role is assigned at sign up and controls your default app experience.'
              : 'If you are new, switch to Sign up to create your account with the selected role.'}
          </p>
        </form>
      </article>
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
              selectedRole === option.value
                ? 'border-emerald-600 bg-emerald-50'
                : 'border-slate-200'
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

function AppShell({ user, profile }: { user: User; profile: ProfileRecord }) {
  async function logout() {
    await signOut(auth)
  }

  const isTrainee = profile.role === 'trainee'
  const isProfessional =
    profile.role === 'trainer' || profile.role === 'nutritionist' || profile.role === 'counsellor'

  if (!profile.role) {
    return <Navigate replace to="/role-select" />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <header className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Cleo Aura Fitness</h1>
            <p className="text-sm text-slate-600">Signed in as {user.email}</p>
          </div>
          <button className="rounded border px-3 py-2 text-sm" onClick={logout} type="button">
            Logout
          </button>
        </div>
        <nav className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app">
            Home
          </Link>
          {isTrainee ? (
            <>
              <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/workouts/new">
                Log Workout
              </Link>
              <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/recovery/new">
                Log Recovery
              </Link>
              <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/check-in">
                Daily Check-In
              </Link>
              <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/progress/new">
                Log Progress
              </Link>
              <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/analytics">
                Analytics
              </Link>
              <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/team">
                Team
              </Link>
            </>
          ) : null}
          {isProfessional ? (
            <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/invite">
              Accept Invite
            </Link>
          ) : null}
          {isTrainee ? (
            <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/history">
              History
            </Link>
          ) : null}
          <Link className="rounded px-3 py-1.5 text-sm hover:bg-slate-100" to="/app/settings">
            Settings
          </Link>
        </nav>
      </header>

      <Outlet context={{ user, profile }} />
    </div>
  )
}

function SettingsScreen({
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

  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Account settings</h2>
      <p className="mt-2 text-sm text-slate-600">
        Role: {roleLabel} (immutable after first selection)
      </p>

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
        Firebase config is missing. Add Vite env vars for auth and Firestore before running
        Milestone 1.
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
          <Route
            element={authUser ? <Navigate replace to="/app" /> : <AuthScreen />}
            path="/auth"
          />
          <Route
            element={
              authUser && profile ? (
                <RoleSelectionScreen
                  onRoleAssigned={role =>
                    setProfile(current => (current ? { ...current, role } : current))
                  }
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
                <AppShell profile={profile} user={authUser} />
              ) : (
                <Navigate replace to="/auth" />
              )
            }
            path="/app"
          >
            <Route index element={<TraineeDashboard />} />
            <Route
              element={profile?.role === 'trainee' ? <WorkoutForm /> : <Navigate replace to="/app" />}
              path="workouts/new"
            />
            <Route
              element={profile?.role === 'trainee' ? <RecoveryForm /> : <Navigate replace to="/app" />}
              path="recovery/new"
            />
            <Route
              element={profile?.role === 'trainee' ? <DailyCheckIn /> : <Navigate replace to="/app" />}
              path="check-in"
            />
            <Route
              element={
                profile?.role === 'trainee' ? <ProgressMeasurementForm /> : <Navigate replace to="/app" />
              }
              path="progress/new"
            />
            <Route
              element={profile?.role === 'trainee' ? <ProgressAnalyticsPage /> : <Navigate replace to="/app" />}
              path="analytics"
            />
            <Route
              element={profile?.role === 'trainee' ? <TeamAccessManager /> : <Navigate replace to="/app" />}
              path="team"
            />
            <Route
              element={
                profile?.role && profile.role !== 'trainee' ? (
                  <InviteAcceptance />
                ) : (
                  <Navigate replace to="/app" />
                )
              }
              path="invite"
            />
            <Route
              element={
                profile?.role && profile.role !== 'trainee' ? (
                  <ProfessionalClientView />
                ) : (
                  <Navigate replace to="/app" />
                )
              }
              path="client/:traineeId"
            />
            <Route
              element={profile?.role === 'trainee' ? <HistoryTimeline /> : <Navigate replace to="/app" />}
              path="history"
            />
            <Route
              element={
                <SettingsScreen
                  onProfileUpdated={displayName =>
                    setProfile(current => (current ? { ...current, displayName } : current))
                  }
                  profile={profile!}
                  user={authUser!}
                />
              }
              path="settings"
            />
          </Route>
          <Route
            element={
              authUser && profile ? (
                <Navigate replace to="/app/settings" />
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
