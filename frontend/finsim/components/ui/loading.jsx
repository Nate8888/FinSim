'use client'

import React from 'react'
import { CandlestickChart } from 'lucide-react'

export function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="rounded-lg bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative h-16 w-16">
            <CandlestickChart className="h-16 w-16 text-primary animate-pulse" />
          </div>
          <p className="text-lg font-semibold text-primary">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default GlobalLoading