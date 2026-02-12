import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryProvider>
        <App />
      </QueryProvider>
    </AppErrorBoundary>
  </StrictMode>
)
