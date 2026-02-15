import { Component, ReactNode } from 'react'
import { captureError } from '../lib/monitoring'

type AppErrorBoundaryProps = {
  children: ReactNode
}

type AppErrorBoundaryState = {
  hasError: boolean
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    void captureError({
      source: 'react.error-boundary',
      message: error.message,
      stack: error.stack,
      extra: info.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto mt-10 max-w-xl rounded-xl border border-red-300 bg-red-50 p-5 text-red-800">
          Something went wrong. Please refresh the page.
        </main>
      )
    }

    return this.props.children
  }
}
