import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'
import { ServiceProvider } from './providers/ServiceProvider'
import './style.css'

createRoot(document.getElementById('app')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <QueryProvider>
        <ServiceProvider>
          <App />
        </ServiceProvider>
      </QueryProvider>
    </AppErrorBoundary>
  </StrictMode>
)
