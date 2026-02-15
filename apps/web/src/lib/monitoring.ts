type MonitoringUser = {
  uid: string
  email?: string | null
}

type MonitoringEvent = {
  message: string
  source: 'window.error' | 'unhandledrejection' | 'react.error-boundary' | 'manual'
  stack?: string
  extra?: unknown
}

const endpoint = import.meta.env.VITE_ERROR_MONITOR_ENDPOINT as string | undefined
const environment = import.meta.env.MODE
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
const release = import.meta.env.VITE_APP_VERSION ?? import.meta.env.VITE_GIT_SHA ?? 'stage'
const tracesSampleRate =
  typeof import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE === 'string'
    ? Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE)
    : environment === 'stage'
      ? 0.2
      : 0.05

let sentryEnabled = false
let Sentry: typeof import('@sentry/react') | null = null

let initialized = false
let currentUser: MonitoringUser | null = null

export function setMonitoringUser(user: MonitoringUser | null) {
  currentUser = user
}

function normalizeExtra(extra: unknown): Record<string, unknown> | undefined {
  if (!extra) return undefined
  if (typeof extra === 'object' && !Array.isArray(extra)) return extra as Record<string, unknown>
  return { detail: extra }
}

export async function captureError(event: MonitoringEvent) {
  const normalizedExtra = normalizeExtra(event.extra)
  const payload = {
    ...event,
    extra: normalizedExtra,
    environment,
    href: typeof window !== 'undefined' ? window.location.href : '',
    user: currentUser,
    timestamp: new Date().toISOString(),
  }

  if (sentryEnabled && Sentry) {
    const message = `${event.source}: ${event.message}`
    if (event.stack) {
      const sentryExtra = { ...(normalizedExtra ?? {}), stack: event.stack }
      Sentry.captureException(new Error(message), { extra: sentryExtra })
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: normalizedExtra })
    }
  }

  if (!endpoint) {
    console.error('[monitoring]', payload)
    return
  }

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
  } catch (caught) {
    console.error('[monitoring] failed to send error event', caught)
  }
}

export function initMonitoring() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  if (sentryDsn) {
    try {
      // Lazy-load Sentry to avoid bundling when unused
      void import('@sentry/react').then(module => {
        Sentry = module
        module.init({
          dsn: sentryDsn,
          environment,
          release,
          tracesSampleRate: tracesSampleRate > 0 && tracesSampleRate <= 1 ? tracesSampleRate : 0.05,
        })
        sentryEnabled = true
      })
    } catch (caught) {
      console.warn('[monitoring] failed to init Sentry', caught)
    }
  }

  window.addEventListener('error', event => {
    void captureError({
      source: 'window.error',
      message: event.message || 'Unhandled window error',
      stack: event.error instanceof Error ? event.error.stack : undefined,
    })
  })

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason
    const reasonMessage =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled rejection'
    void captureError({
      source: 'unhandledrejection',
      message: reasonMessage,
      stack: reason instanceof Error ? reason.stack : undefined,
      extra: reason,
    })
  })
}
