'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function Signin() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Sign-in logic here
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto min-h-screen max-w-md px-6 py-12">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="rounded-full bg-background p-4 shadow-sm">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
          <p className="text-sm text-muted-foreground">Log In Your Account</p>
        </div>
        {/* <div className="mt-8 text-center">
          <p className="text-lg font-bold text-primary">
            Invest, Play, Learn!
          </p>
          <p className="text-sm text-muted-foreground">
            Master The Markets In A World Of Simulation!
          </p>
        </div> */}
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">EMAIL</Label>
            <Input
              id="email"
              placeholder="email"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required
              className="shadow-md"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">PASSWORD</Label>
            <Input
              id="password"
              placeholder="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              required
              className="shadow-md"
            />
          </div>
          <Button className="w-full bg-yellow-400 font-medium hover:bg-yellow-500 text-black" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>
        <Button
          variant="outline"
          type="button"
          className="mt-6 w-full bg-black text-white hover:bg-gray-800"
          disabled={isLoading}
          onClick={() => {
            // TODO: Google sign-in logic here
          }}
        >
          Sign in with Google
        </Button>
        <div className="mt-6 text-center text-sm">
          <Link href="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="mt-2 text-center text-sm text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/signup" className="font-medium underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}