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

let initialized = false
let currentUser: MonitoringUser | null = null

export function setMonitoringUser(user: MonitoringUser | null) {
  currentUser = user
}

export async function captureError(event: MonitoringEvent) {
  const payload = {
    ...event,
    environment,
    href: typeof window !== 'undefined' ? window.location.href : '',
    user: currentUser,
    timestamp: new Date().toISOString(),
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
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'Unhandled rejection'
    void captureError({
      source: 'unhandledrejection',
      message: reasonMessage,
      stack: reason instanceof Error ? reason.stack : undefined,
      extra: reason,
    })
  })
}
