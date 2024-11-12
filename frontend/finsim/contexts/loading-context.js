'use client'

import React, { createContext, useContext, useState } from 'react'
import GlobalLoading from '@/components/ui/loading'

const LoadingContext = createContext({
  setLoading: () => {},
})

export const useLoading = () => useContext(LoadingContext)

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <LoadingContext.Provider value={{ setLoading: setIsLoading }}>
      {isLoading && <GlobalLoading />}
      {children}
    </LoadingContext.Provider>
  )
}