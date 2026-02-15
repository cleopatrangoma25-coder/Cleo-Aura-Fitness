import { createContext, ReactNode, useContext, useMemo } from 'react'
import { db } from '../lib/firebase'
import { SessionService } from '../services/SessionService'
import { EnrollmentService } from '../services/EnrollmentService'

type Services = {
  session: SessionService
  enrollment: EnrollmentService
}

const ServiceContext = createContext<Services | null>(null)

export function ServiceProvider({ children }: { children: ReactNode }) {
  const services = useMemo<Services>(
    () => ({
      session: new SessionService(db),
      enrollment: new EnrollmentService(db),
    }),
    []
  )

  return <ServiceContext.Provider value={services}>{children}</ServiceContext.Provider>
}

export function useServices(): Services {
  const value = useContext(ServiceContext)
  if (!value) throw new Error('ServiceProvider is missing in component tree.')
  return value
}
