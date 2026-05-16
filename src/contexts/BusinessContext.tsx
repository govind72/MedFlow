'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { BusinessContext as BusinessContextType } from '@/lib/types/database'

const BusinessContext = createContext<BusinessContextType | null>(null)

export function BusinessProvider({
  children,
  value,
}: {
  children: ReactNode
  value: BusinessContextType
}) {
  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusinessContext(): BusinessContextType {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error(
      'useBusinessContext must be used within a BusinessProvider'
    )
  }
  return context
}
