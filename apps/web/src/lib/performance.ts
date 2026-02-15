import { getPerformance } from 'firebase/performance'
import { hasFirebaseConfig } from './firebase'
import { getApp } from 'firebase/app'

let initialized = false

export function initPerformanceMonitoring() {
  if (initialized || typeof window === 'undefined') return
  if (!hasFirebaseConfig) return
  try {
    getPerformance(getApp())
    initialized = true
  } catch {
    // ignore performance init issues to avoid blocking the app
  }
}
